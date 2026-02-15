# ML Core - Machine Learning Pipeline

This package implements the end-to-end ML pipeline for the **AI-Powered Smart Patient Triage** system. It is designed to run independently of the FastAPI web server.

## Package Layout

```
ml_core/
  __init__.py              # Package marker
  config.py                # Hyperparameters, paths, constants
  data_generator.py        # Synthetic medical data generation
  training_pipeline.py     # Model training & artifact persistence
  inference.py             # Production prediction interface
  README_ML.md             # This file
```

## Prerequisites

From `server/`, install the ML dependencies (on top of the existing `requirements.txt`):

```bash
pip install pandas scikit-learn joblib
```

## 1. Generate Synthetic Data

```bash
# Default: 5 000 samples, noise factor 0.15
python -m ml_core.data_generator

# Custom parameters
python -m ml_core.data_generator --samples 20000 --noise 0.25
```

Output is written to `server/data/synthetic_triage_data.csv`.

## 2. Train Models

```bash
python -m ml_core.training_pipeline
```

This will:
1. Load the CSV from `data/`.
2. Preprocess features (scale, encode, split).
3. Train a **Risk Classifier** and a **Department Classifier**.
4. Print evaluation metrics to stdout.
5. Save artifacts to `server/models/` (`*.pkl` files).

## 3. Evaluate Model Performance

To get a detailed evaluation report on the test set:

```bash
python -m ml_core.evaluate_model
```

This will load the saved models and the dataset, recreate the test split (ensuring no data leakage), and print:
- Accuracy, Precision, Recall, F1 Score
- Detailed Classification Report per class
- Confusion Matrix

## 4. Run Inference (programmatic)

```python
from ml_core.inference import TriagePredictor

predictor = TriagePredictor()
result = predictor.predict({
    "age": 65,
    "heart_rate": 110,
    "blood_pressure_systolic": 150,
    "blood_pressure_diastolic": 95,
    "temperature": 38.7,
    "oxygen_saturation": 92,
    "pain_level": 8,
    "symptom_duration_hours": 3.5,
})
print(result)
# {
#     "risk_level": "high",
#     "risk_confidence": 0.87,
#     "department": "Cardiology",
#     "department_confidence": 0.74,
# }
```

## Notes

- All paths are resolved automatically via `config.py`.
- `data/` and `models/` contents are git-ignored; only `.gitkeep` is tracked.
- Set `RANDOM_SEED` in `config.py` to change reproducibility seed globally.
