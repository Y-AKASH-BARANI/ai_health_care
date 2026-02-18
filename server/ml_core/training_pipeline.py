"""
training_pipeline.py - Model Training & Artifact Persistence
=============================================================

Orchestrates the full training workflow:

1. Load the synthetic (or real) CSV dataset.
2. Preprocess features (scaling, encoding, TF-IDF for text).
3. Train two classifiers:
   - **Risk Classifier** -- predicts patient acuity level (Low/Medium/High).
   - **Department Classifier** -- routes the patient to the right unit.
4. Evaluate on a held-out test split and print classification reports.
5. Serialise trained sklearn Pipelines to ``server/models/``.

Each saved ``.pkl`` is a *full* sklearn ``Pipeline`` (ColumnTransformer +
RandomForestClassifier), so inference only needs a single ``joblib.load``
per task -- no separate preprocessor artifact.

Usage (standalone)::

    python -m ml_core.training_pipeline
"""

from __future__ import annotations

import os
from typing import Any, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml_core.config import (
    DATA_DIR,
    DEPARTMENT_MODEL_PATH,
    MODELS_DIR,
    N_ESTIMATORS,
    MAX_DEPTH,
    RANDOM_SEED,
    RISK_MODEL_PATH,
    TRAIN_TEST_SPLIT,
)

# ---------------------------------------------------------------------------
# Column groups (must match the CSV produced by data_generator.py)
# ---------------------------------------------------------------------------
NUMERICAL_COLS = ["age", "bp_systolic", "heart_rate", "temperature"]
CATEGORICAL_COLS = ["gender"]
TEXT_COL = "symptoms"

TARGET_RISK = "risk_level"
TARGET_DEPT = "department"


class TrainingPipeline:
    """End-to-end training pipeline for the triage ML models.

    Each model is stored as a complete sklearn ``Pipeline`` that chains
    a ``ColumnTransformer`` (StandardScaler + OneHotEncoder + TfidfVectorizer)
    with a ``RandomForestClassifier``.

    Attributes
    ----------
    seed : int
        Random seed used across all stochastic operations.
    test_size : float
        Fraction of data reserved for evaluation.
    """

    def __init__(
        self,
        seed: int = RANDOM_SEED,
        test_size: float = TRAIN_TEST_SPLIT,
    ) -> None:
        self.seed = seed
        self.test_size = test_size
        self._risk_pipeline: Pipeline | None = None
        self._dept_pipeline: Pipeline | None = None

    # ── helpers ────────────────────────────────────────────────────────
    @staticmethod
    def _build_pipeline(seed: int) -> Pipeline:
        """Construct a fresh sklearn Pipeline (preprocessor + classifier)."""
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), NUMERICAL_COLS),
                ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_COLS),
                ("txt", TfidfVectorizer(max_features=200, stop_words="english"), TEXT_COL),
            ],
            remainder="drop",
        )
        return Pipeline(
            [
                ("preprocessor", preprocessor),
                (
                    "classifier",
                    RandomForestClassifier(
                        n_estimators=N_ESTIMATORS,
                        max_depth=MAX_DEPTH,
                        random_state=seed,
                        n_jobs=-1,
                    ),
                ),
            ]
        )

    def load_data(self, csv_path: Optional[str] = None) -> pd.DataFrame:
        """Load the triage dataset from a CSV file.

        Parameters
        ----------
        csv_path : str | None
            Path to the CSV.  Defaults to
            ``server/data/triage_dataset.csv``.

        Returns
        -------
        pd.DataFrame
        """
        if csv_path is None:
            csv_path = os.path.join(DATA_DIR, "triage_dataset.csv")

        df = pd.read_csv(csv_path)
        required = set(NUMERICAL_COLS + CATEGORICAL_COLS + [TEXT_COL, TARGET_RISK, TARGET_DEPT])
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Dataset is missing columns: {missing}")
        return df

    # ── Preprocessing (split only -- transforms live inside Pipeline) ──
    def preprocess(
        self, df: pd.DataFrame
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, pd.Series]:
        """Split the data into train / test sets.

        The actual feature transformation (scaling, encoding, TF-IDF)
        is handled inside the sklearn ``Pipeline`` so it is fit only on
        the training fold.

        Returns
        -------
        tuple
            (X_train, X_test, y_risk_train, y_risk_test,
             y_dept_train, y_dept_test)
        """
        feature_cols = NUMERICAL_COLS + CATEGORICAL_COLS + [TEXT_COL]
        X = df[feature_cols]
        y_risk = df[TARGET_RISK]
        y_dept = df[TARGET_DEPT]

        X_train, X_test, y_risk_train, y_risk_test, y_dept_train, y_dept_test = (
            train_test_split(
                X, y_risk, y_dept,
                test_size=self.test_size,
                random_state=self.seed,
                stratify=y_risk,
            )
        )
        return X_train, X_test, y_risk_train, y_risk_test, y_dept_train, y_dept_test


    def train_risk_model(self, X_train: pd.DataFrame, y_train: pd.Series) -> Pipeline:
        """Train the patient risk-level classifier pipeline."""
        self._risk_pipeline = self._build_pipeline(self.seed)
        self._risk_pipeline.fit(X_train, y_train)
        return self._risk_pipeline

    def train_department_model(self, X_train: pd.DataFrame, y_train: pd.Series) -> Pipeline:
        """Train the department-routing classifier pipeline."""
        self._dept_pipeline = self._build_pipeline(self.seed)
        self._dept_pipeline.fit(X_train, y_train)
        return self._dept_pipeline

    @staticmethod
    def evaluate(pipeline: Pipeline, X_test: pd.DataFrame, y_test: pd.Series, label: str) -> dict:
        """Compute and print classification metrics.

        Parameters
        ----------
        pipeline : Pipeline
            A trained sklearn Pipeline.
        X_test : pd.DataFrame
            Test features.
        y_test : pd.Series
            True labels.
        label : str
            Human-readable name for the task (used in print output).

        Returns
        -------
        dict
            ``{"accuracy": float, "report": str}``
        """
        y_pred = pipeline.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, zero_division=0)

        print(f"\n{'=' * 60}")
        print(f"  {label}  --  Accuracy: {acc:.4f}")
        print(f"{'=' * 60}")
        print(report)

        return {"accuracy": round(acc, 4), "report": report}

    # ── Persistence ────────────────────────────────────────────────────
    def save_artifacts(self) -> None:
        """Serialise the trained pipelines to disk.

        Files are written to the paths defined in ``config.py``:
            - ``RISK_MODEL_PATH``   (risk_classifier.pkl)
            - ``DEPARTMENT_MODEL_PATH`` (department_classifier.pkl)
        """
        os.makedirs(MODELS_DIR, exist_ok=True)

        if self._risk_pipeline is not None:
            joblib.dump(self._risk_pipeline, RISK_MODEL_PATH)
            print(f"Saved risk pipeline      -> {RISK_MODEL_PATH}")

        if self._dept_pipeline is not None:
            joblib.dump(self._dept_pipeline, DEPARTMENT_MODEL_PATH)
            print(f"Saved department pipeline -> {DEPARTMENT_MODEL_PATH}")

    # ── Convenience runner ─────────────────────────────────────────────
    def run(self, csv_path: Optional[str] = None) -> dict:
        """Execute the full pipeline: load -> preprocess -> train -> evaluate -> save.

        Returns
        -------
        dict
            Combined evaluation metrics for both models.
        """
        print("Loading dataset ...")
        df = self.load_data(csv_path)
        print(f"  {len(df)} rows, {len(df.columns)} columns")

        print("Splitting data ...")
        X_train, X_test, y_risk_train, y_risk_test, y_dept_train, y_dept_test = (
            self.preprocess(df)
        )
        print(f"  Train: {len(X_train)}  |  Test: {len(X_test)}")

        print("Training risk-level model ...")
        self.train_risk_model(X_train, y_risk_train)
        risk_metrics = self.evaluate(self._risk_pipeline, X_test, y_risk_test, "Risk Level Classifier")

        print("Training department model ...")
        self.train_department_model(X_train, y_dept_train)
        dept_metrics = self.evaluate(self._dept_pipeline, X_test, y_dept_test, "Department Classifier")

        print("\nSaving artifacts ...")
        self.save_artifacts()

        return {"risk": risk_metrics, "department": dept_metrics}


# ── CLI entry-point ────────────────────────────────────────────────────────
if __name__ == "__main__":
    pipeline = TrainingPipeline()
    metrics = pipeline.run()
    print("\nTraining complete.")
