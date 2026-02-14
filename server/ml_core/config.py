"""
config.py - Centralised Configuration for the ML Pipeline
==========================================================

Stores all hyperparameters, file paths, and constants used across
the data-generation, training, and inference stages.  Modify values
here instead of scattering magic numbers throughout the codebase.
"""

import os

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
RANDOM_SEED: int = 42

# ---------------------------------------------------------------------------
# Data Generation
# ---------------------------------------------------------------------------
DEFAULT_NUM_SAMPLES: int = 5_000
NOISE_FACTOR: float = 0.15          # σ multiplier for Gaussian noise
TRAIN_TEST_SPLIT: float = 0.20     # fraction reserved for evaluation

# ---------------------------------------------------------------------------
# Feature / Label Schema
# ---------------------------------------------------------------------------
FEATURE_COLUMNS: list[str] = [
    "age",
    "gender",
    "symptoms",
    "bp_systolic",
    "heart_rate",
    "temperature",
]

RISK_LABELS: list[str] = ["Low", "Medium", "High"]
DEPARTMENT_LABELS: list[str] = [
    "General Medicine",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Pulmonology",
    "Emergency",
]

# ---------------------------------------------------------------------------
# Model Training
# ---------------------------------------------------------------------------
N_ESTIMATORS: int = 200
MAX_DEPTH: int | None = 12
LEARNING_RATE: float = 0.1

# ---------------------------------------------------------------------------
# Paths (resolved relative to *this* file → server/ml_core/)
# ---------------------------------------------------------------------------
_PACKAGE_DIR = os.path.dirname(os.path.abspath(__file__))
_SERVER_DIR = os.path.dirname(_PACKAGE_DIR)

DATA_DIR: str = os.path.join(_SERVER_DIR, "data")
MODELS_DIR: str = os.path.join(_SERVER_DIR, "models")

RISK_MODEL_PATH: str = os.path.join(MODELS_DIR, "risk_classifier.pkl")
DEPARTMENT_MODEL_PATH: str = os.path.join(MODELS_DIR, "department_classifier.pkl")

# Alternate filenames (for manually placed pre-trained models)
RISK_MODEL_ALT_PATH: str = os.path.join(MODELS_DIR, "risk_model.pkl")
DEPARTMENT_MODEL_ALT_PATH: str = os.path.join(MODELS_DIR, "dept_model.pkl")

PREPROCESSOR_PATH: str = os.path.join(MODELS_DIR, "preprocessor.pkl")
