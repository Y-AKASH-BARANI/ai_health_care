"""
data_generator.py - Synthetic Medical Data Generator
=====================================================

Generates realistic, noisy patient-triage datasets for training the
Risk-Level and Department classifiers.  The data mimics vital signs
and symptom metadata typically captured during an ER intake.

Each record is derived from one of seven **Clinical Archetypes** that
define plausible vital-sign distributions and symptom phrases.  Gaussian
noise is applied to all numerical vitals, and a configurable fraction of
rows are deliberately corrupted (label-vital mismatch) to simulate the
messiness of real-world medical data.

Usage (standalone)::

    python -m ml_core.data_generator --samples 5000 --noise 0.10

The output CSV is written to ``server/data/triage_dataset.csv``.
"""

from __future__ import annotations

import os
from typing import Optional

import numpy as np
import pandas as pd

from ml_core.config import (
    DATA_DIR,
    DEFAULT_NUM_SAMPLES,
    NOISE_FACTOR,
    RANDOM_SEED,
)

# ---------------------------------------------------------------------------
# Clinical Archetypes
# ---------------------------------------------------------------------------
# Each archetype is a dict describing:
#   - vitals: (mean, std) tuples for bp_systolic, heart_rate, temperature
#   - age_range: (min, max) inclusive
#   - symptoms: list of natural-language symptom strings
#   - risk_level: ground-truth triage label
#   - department: target department
#   - weight: relative sampling probability
# ---------------------------------------------------------------------------

ARCHETYPES: list[dict] = [
    {
        "name": "Cardiac Emergency",
        "vitals": {
            "bp_systolic": (165, 20),
            "heart_rate": (115, 18),
            "temperature": (37.2, 0.4),
        },
        "age_range": (45, 85),
        "symptoms": [
            "chest pain radiating to left arm",
            "crushing chest pressure with shortness of breath",
            "chest tightness, sweating, and nausea",
            "sudden sharp chest pain and dizziness",
            "palpitations with chest discomfort and jaw pain",
        ],
        "risk_level": "High",
        "department": "Cardiology",
        "weight": 1.0,
    },
    {
        "name": "Respiratory Infection",
        "vitals": {
            "bp_systolic": (125, 12),
            "heart_rate": (90, 12),
            "temperature": (38.6, 0.6),
        },
        "age_range": (18, 75),
        "symptoms": [
            "persistent cough with yellow sputum for 5 days",
            "fever, body aches, and difficulty breathing",
            "sore throat, congestion, and mild shortness of breath",
            "wheezing and productive cough worse at night",
            "high fever with chills and chest congestion",
        ],
        "risk_level": "Medium",
        "department": "Pulmonology",
        "weight": 1.2,
    },
    {
        "name": "Neurological Event",
        "vitals": {
            "bp_systolic": (155, 22),
            "heart_rate": (88, 15),
            "temperature": (37.0, 0.3),
        },
        "age_range": (35, 90),
        "symptoms": [
            "sudden severe headache and blurred vision",
            "numbness on left side of body and slurred speech",
            "dizziness, confusion, and loss of balance",
            "migraine with aura and vomiting for 12 hours",
            "seizure episode lasting 2 minutes with postictal confusion",
        ],
        "risk_level": "High",
        "department": "Neurology",
        "weight": 0.9,
    },
    {
        "name": "Orthopedic Injury",
        "vitals": {
            "bp_systolic": (130, 10),
            "heart_rate": (85, 10),
            "temperature": (36.8, 0.3),
        },
        "age_range": (15, 70),
        "symptoms": [
            "fall with severe pain and swelling in right ankle",
            "twisted knee during sports, unable to bear weight",
            "lower back pain radiating down left leg for 2 weeks",
            "wrist deformity and swelling after fall on outstretched hand",
            "shoulder pain and inability to raise arm after lifting",
        ],
        "risk_level": "Low",
        "department": "Orthopedics",
        "weight": 1.1,
    },
    {
        "name": "General / Mild Illness",
        "vitals": {
            "bp_systolic": (120, 8),
            "heart_rate": (76, 8),
            "temperature": (37.0, 0.4),
        },
        "age_range": (18, 65),
        "symptoms": [
            "general fatigue and malaise for the past week",
            "mild headache and low-grade fever",
            "nausea and loss of appetite for 3 days",
            "mild abdominal discomfort and bloating after meals",
            "persistent tiredness despite adequate sleep",
        ],
        "risk_level": "Low",
        "department": "General Medicine",
        "weight": 1.3,
    },
    {
        "name": "Pediatric Acute",
        "vitals": {
            "bp_systolic": (100, 8),
            "heart_rate": (110, 15),
            "temperature": (38.8, 0.7),
        },
        "age_range": (1, 14),
        "symptoms": [
            "high fever, irritability, and refusing to eat",
            "ear pain and crying, pulling at right ear",
            "rash on trunk with fever for 2 days",
            "vomiting and diarrhea since last night",
            "croupy cough and stridor with mild respiratory distress",
        ],
        "risk_level": "Medium",
        "department": "Pediatrics",
        "weight": 0.8,
    },
    {
        "name": "Emergency Trauma",
        "vitals": {
            "bp_systolic": (95, 20),
            "heart_rate": (125, 20),
            "temperature": (36.5, 0.5),
        },
        "age_range": (16, 70),
        "symptoms": [
            "motor vehicle accident with abdominal pain and dizziness",
            "deep laceration on forearm with active bleeding",
            "fall from height with back pain and difficulty moving legs",
            "assault with facial trauma and loss of consciousness",
            "burn injury covering forearm and hand, blistering",
        ],
        "risk_level": "High",
        "department": "Emergency",
        "weight": 0.7,
    },
]

GENDERS = ["Male", "Female"]


def generate_synthetic_data(
    num_samples: int = DEFAULT_NUM_SAMPLES,
    noise_level: float = NOISE_FACTOR,
    output_path: Optional[str] = None,
    seed: int = RANDOM_SEED,
) -> pd.DataFrame:
    """Create a synthetic patient-triage dataset and persist it as CSV.

    Parameters
    ----------
    num_samples : int, default ``DEFAULT_NUM_SAMPLES``
        Number of patient records to generate.
    noise_level : float, default ``NOISE_FACTOR``
        Fraction of rows whose labels are deliberately swapped with their
        vitals to simulate real-world data noise.  Also controls the
        Gaussian jitter multiplier on vital signs.
    output_path : str | None
        Full path for the output CSV.  When *None*, defaults to
        ``server/data/triage_dataset.csv``.
    seed : int, default ``RANDOM_SEED``
        Seed for the random number generator to ensure reproducibility.

    Returns
    -------
    pd.DataFrame
        The generated DataFrame (also saved to disk).
    """
    rng = np.random.default_rng(seed)

    # --- Compute per-archetype sample counts proportional to weights ------
    weights = np.array([a["weight"] for a in ARCHETYPES])
    weights = weights / weights.sum()
    counts = rng.multinomial(num_samples, weights)

    records: list[dict] = []

    for archetype, n in zip(ARCHETYPES, counts):
        v = archetype["vitals"]

        # Sample vitals from Gaussian distributions
        bp = rng.normal(v["bp_systolic"][0], v["bp_systolic"][1], size=n)
        hr = rng.normal(v["heart_rate"][0], v["heart_rate"][1], size=n)
        temp = rng.normal(v["temperature"][0], v["temperature"][1], size=n)

        # Ages uniform within archetype range
        lo, hi = archetype["age_range"]
        ages = rng.integers(lo, hi + 1, size=n)

        # Random gender
        genders = rng.choice(GENDERS, size=n)

        # Random symptom selection (with replacement)
        symptoms = rng.choice(archetype["symptoms"], size=n)

        for i in range(n):
            records.append(
                {
                    "age": int(ages[i]),
                    "gender": genders[i],
                    "symptoms": symptoms[i],
                    "bp_systolic": round(float(bp[i]), 1),
                    "heart_rate": round(float(hr[i]), 1),
                    "temperature": round(float(temp[i]), 1),
                    "risk_level": archetype["risk_level"],
                    "department": archetype["department"],
                }
            )

    df = pd.DataFrame(records)

    # --- Noise injection: mismatch labels for a fraction of rows ----------
    n_noisy = int(len(df) * noise_level)
    noisy_idx = rng.choice(df.index, size=n_noisy, replace=False)

    all_risks = ["Low", "Medium", "High"]
    all_depts = list({a["department"] for a in ARCHETYPES})

    for idx in noisy_idx:
        # Swap risk_level to a *different* label
        current_risk = df.at[idx, "risk_level"]
        other_risks = [r for r in all_risks if r != current_risk]
        df.at[idx, "risk_level"] = rng.choice(other_risks)

        # Swap department to a *different* label
        current_dept = df.at[idx, "department"]
        other_depts = [d for d in all_depts if d != current_dept]
        df.at[idx, "department"] = rng.choice(other_depts)

    # --- Shuffle rows so archetypes aren't grouped -------------------------
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    # --- Persist to CSV ----------------------------------------------------
    if output_path is None:
        output_path = os.path.join(DATA_DIR, "triage_dataset.csv")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    return df


# ── CLI entry-point ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate synthetic triage data for the AI Triage System"
    )
    parser.add_argument(
        "--samples", type=int, default=DEFAULT_NUM_SAMPLES,
        help=f"Number of patient records to generate (default: {DEFAULT_NUM_SAMPLES})",
    )
    parser.add_argument(
        "--noise", type=float, default=NOISE_FACTOR,
        help=f"Fraction of rows to corrupt with label noise (default: {NOISE_FACTOR})",
    )
    args = parser.parse_args()

    out = os.path.join(DATA_DIR, "triage_dataset.csv")
    df = generate_synthetic_data(num_samples=args.samples, noise_level=args.noise)
    print(f"Generated {len(df)} records -> {out}")
    print(f"\nRisk distribution:\n{df['risk_level'].value_counts().to_string()}")
    print(f"\nDepartment distribution:\n{df['department'].value_counts().to_string()}")
    print(f"\nSample rows:\n{df.head(3).to_string()}")
