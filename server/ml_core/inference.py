"""
inference.py - Production Inference Wrapper
============================================

Provides a thin, import-friendly interface that the FastAPI application
layer can use to obtain predictions without knowing anything about
model internals or file paths.

Each ``.pkl`` artifact is a complete sklearn ``Pipeline``
(ColumnTransformer + RandomForestClassifier), so a single
``joblib.load`` gives us a ready-to-predict object.

Typical usage from the web app::

    from ml_core.inference import predictor

    result = predictor.predict(patient)    # dict in -> dict out
"""

from __future__ import annotations

import logging
import os
from typing import Any

import joblib
import numpy as np
import pandas as pd

from ml_core.config import (
    DEPARTMENT_MODEL_ALT_PATH,
    DEPARTMENT_MODEL_PATH,
    RISK_MODEL_ALT_PATH,
    RISK_MODEL_PATH,
)

logger = logging.getLogger(__name__)


def _resolve_path(primary: str, alternate: str) -> str | None:
    """Return whichever model file exists, preferring *primary*."""
    if os.path.isfile(primary):
        return primary
    if os.path.isfile(alternate):
        return alternate
    return None


class TriagePredictor:
    """Stateful predictor that loads model artifacts on first use.

    The class lazily loads the serialised sklearn Pipelines so that
    import time stays minimal and the heavy I/O only happens once.

    Attributes
    ----------
    ready : bool
        ``True`` once both pipelines have been loaded successfully.
        When ``False``, :meth:`predict` will attempt to load before
        running -- if loading fails it returns ``None`` so the caller
        can fall back to a Gemini-only path.
    """

    def __init__(self) -> None:
        self._risk_pipeline = None
        self._dept_pipeline = None
        self.ready: bool = False

    # ── Artifact Loading ───────────────────────────────────────────────
    def load_models(self) -> None:
        """Deserialise the trained pipelines from ``server/models/``.

        Accepts two naming conventions:
          - ``risk_classifier.pkl`` / ``department_classifier.pkl`` (training pipeline output)
          - ``risk_model.pkl`` / ``dept_model.pkl`` (manually placed pre-trained models)

        Sets ``self.ready = True`` on success.

        Raises
        ------
        FileNotFoundError
            If neither naming convention is found for a required model.
        """
        risk_path = _resolve_path(RISK_MODEL_PATH, RISK_MODEL_ALT_PATH)
        dept_path = _resolve_path(DEPARTMENT_MODEL_PATH, DEPARTMENT_MODEL_ALT_PATH)

        if risk_path is None:
            raise FileNotFoundError(
                f"Risk model not found. Looked for:\n"
                f"  {RISK_MODEL_PATH}\n  {RISK_MODEL_ALT_PATH}\n"
                "Run `python -m ml_core.training_pipeline` or place your "
                "pre-trained risk_model.pkl in server/models/."
            )
        if dept_path is None:
            raise FileNotFoundError(
                f"Department model not found. Looked for:\n"
                f"  {DEPARTMENT_MODEL_PATH}\n  {DEPARTMENT_MODEL_ALT_PATH}\n"
                "Run `python -m ml_core.training_pipeline` or place your "
                "pre-trained dept_model.pkl in server/models/."
            )

        self._risk_pipeline = joblib.load(risk_path)
        self._dept_pipeline = joblib.load(dept_path)
        self.ready = True
        logger.info("Models loaded: risk=%s  dept=%s", risk_path, dept_path)

    # ── Prediction ─────────────────────────────────────────────────────
    def predict(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Run inference on a single patient record.

        Parameters
        ----------
        input_data : dict[str, Any]
            Must contain the keys expected by the training pipeline::

                {
                    "age": 65,
                    "gender": "Male",
                    "symptoms": "chest pain radiating to left arm",
                    "bp_systolic": 165.3,
                    "heart_rate": 112.0,
                    "temperature": 37.4,
                }

        Returns
        -------
        dict[str, Any]
            ::

                {
                    "risk_level": "High",
                    "risk_confidence": 0.87,
                    "department": "Cardiology",
                    "department_confidence": 0.74,
                }
        """
        if not self.ready:
            self.load_models()

        # Build a single-row DataFrame so the ColumnTransformer inside
        # each Pipeline receives the same structure it was trained on.
        df = pd.DataFrame([input_data])

        # --- Risk prediction ------------------------------------------------
        risk_pred = self._risk_pipeline.predict(df)[0]
        risk_proba = self._risk_pipeline.predict_proba(df)[0]
        risk_conf = float(np.max(risk_proba))

        # --- Department prediction -------------------------------------------
        dept_pred = self._dept_pipeline.predict(df)[0]
        dept_proba = self._dept_pipeline.predict_proba(df)[0]
        dept_conf = float(np.max(dept_proba))

        return {
            "risk_level": risk_pred,
            "risk_confidence": round(risk_conf, 4),
            "department": dept_pred,
            "department_confidence": round(dept_conf, 4),
        }


# ---------------------------------------------------------------------------
# Module-level singleton -- import this directly in the router / app layer.
# Models are lazy-loaded on first predict() call.
# ---------------------------------------------------------------------------
predictor = TriagePredictor()


# ── Quick smoke test ──────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = {
        "age": 62,
        "gender": "Male",
        "symptoms": "crushing chest pressure with shortness of breath",
        "bp_systolic": 172.5,
        "heart_rate": 118.3,
        "temperature": 37.1,
    }

    result = predictor.predict(sample)
    print("Input :", sample)
    print("Output:", result)
    print("Ready :", predictor.ready)
