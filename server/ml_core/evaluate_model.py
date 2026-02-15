"""
evaluate_model.py - Model Evaluation Script
===========================================

Loads the trained models from disk and evaluates them against the
test split of the dataset. reliably reproducing the train/test
split using the configured random seed.
"""

import os
import sys
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)

# Add the server directory to python path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml_core.config import (
    DATA_DIR,
    RANDOM_SEED,
    TRAIN_TEST_SPLIT,
    RISK_MODEL_PATH,
    DEPARTMENT_MODEL_PATH,
    FEATURE_COLUMNS,
    RISK_LABELS,
    DEPARTMENT_LABELS,
    RISK_MODEL_ALT_PATH,
    DEPARTMENT_MODEL_ALT_PATH
)

def _resolve_path(primary, alternate):
    if os.path.exists(primary):
        return primary
    if os.path.exists(alternate):
        return alternate
    return None

def load_data():
    """Load and split the dataset."""
    csv_path = os.path.join(DATA_DIR, "triage_dataset.csv")
    if not os.path.exists(csv_path):
        print(f"Error: Dataset not found at {csv_path}")
        return None, None, None, None

    df = pd.read_csv(csv_path)
    
    # Separate features and targets
    X = df[FEATURE_COLUMNS]
    y_risk = df["risk_level"]
    y_dept = df["department"]

    # Split for Risk Model
    X_train_r, X_test_r, y_risk_train, y_risk_test = train_test_split(
        X, y_risk, test_size=TRAIN_TEST_SPLIT, random_state=RANDOM_SEED, stratify=y_risk
    )

    # Split for Department Model
    X_train_d, X_test_d, y_dept_train, y_dept_test = train_test_split(
        X, y_dept, test_size=TRAIN_TEST_SPLIT, random_state=RANDOM_SEED, stratify=y_dept
    )
    
    # Note: We return the test sets. 
    # Since we use the same seed and stratify, X_test_r should be identical to X_test_d 
    # but we keep them separate just in case the split logic diverges in future.
    return X_test_r, y_risk_test, X_test_d, y_dept_test

def evaluate_model(model_path, X_test, y_test, model_name, potential_labels=None):
    """Load a model and print evaluation metrics."""
    print(f"\n{'='*60}")
    print(f"EVALUATING: {model_name}")
    print(f"{'='*60}")

    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return

    try:
        model = joblib.load(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # Predictions
    y_pred = model.predict(X_test)

    # Metrics
    acc = accuracy_score(y_test, y_pred)
    
    # Weighted Metrics (accounts for class imbalance)
    prec_weighted = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    rec_weighted = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)

    # Macro Metrics (treats all classes equally)
    prec_macro = precision_score(y_test, y_pred, average='macro', zero_division=0)
    rec_macro = recall_score(y_test, y_pred, average='macro', zero_division=0)
    f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)

    print(f"Accuracy:          {acc:.4f}")
    print(f"Precision (W):     {prec_weighted:.4f}")
    print(f"Recall (W):        {rec_weighted:.4f}")
    print(f"F1 Score (W):      {f1_weighted:.4f}")
    print(f"Precision (Macro): {prec_macro:.4f}")
    print(f"Recall (Macro):    {rec_macro:.4f}")
    print(f"F1 Score (Macro):  {f1_macro:.4f}")
    
    print("\n--- Classification Report ---")
    if potential_labels:
        print(classification_report(y_test, y_pred, labels=potential_labels, zero_division=0))
    else:
        print(classification_report(y_test, y_pred, zero_division=0))
    
    print("\n--- Confusion Matrix ---")
    cm = confusion_matrix(y_test, y_pred, labels=potential_labels)
    
    # Pretty print confusion matrix
    if potential_labels:
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 1000)
        df_cm = pd.DataFrame(cm, index=[f"True:{l}" for l in potential_labels], 
                             columns=[f"Pred:{l}" for l in potential_labels])
        print(df_cm)
    else:
        print(cm)

def main():
    print("Loading data...")
    X_risk, y_risk, X_dept, y_dept = load_data()
    
    if X_risk is None:
        return

    # Resolve model paths
    risk_model_path = _resolve_path(RISK_MODEL_PATH, RISK_MODEL_ALT_PATH)
    dept_model_path = _resolve_path(DEPARTMENT_MODEL_PATH, DEPARTMENT_MODEL_ALT_PATH)

    if risk_model_path:
        evaluate_model(risk_model_path, X_risk, y_risk, "Risk Classifier", RISK_LABELS)
    else:
        print(f"Error: Risk model not found. Checked {RISK_MODEL_PATH} and {RISK_MODEL_ALT_PATH}")

    if dept_model_path:
        evaluate_model(dept_model_path, X_dept, y_dept, "Department Classifier", DEPARTMENT_LABELS)
    else:
        print(f"Error: Department model not found. Checked {DEPARTMENT_MODEL_PATH} and {DEPARTMENT_MODEL_ALT_PATH}")

if __name__ == "__main__":
    main()
