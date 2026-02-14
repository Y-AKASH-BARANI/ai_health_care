import logging
from typing import Any

from fastapi import APIRouter, File, Form, UploadFile

from app.ai_engine.gemini import analyze_report
from ml_core.inference import predictor

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# The ML predictor singleton is imported from ml_core.inference.
# Models are lazy-loaded on first predict() call.
# ---------------------------------------------------------------------------

# Default vital signs used when the form does not provide values.
_DEFAULT_BP_SYSTOLIC: float = 120.0
_DEFAULT_HEART_RATE: float = 80.0
_DEFAULT_TEMPERATURE: float = 37.0

# ---------------------------------------------------------------------------
# Hybrid prompt sent to Gemini *after* the ML model has made its prediction.
# ---------------------------------------------------------------------------
_HYBRID_PROMPT = """You are an AI medical triage assistant.

Patient Demographics:
- Age: {age}
- Gender: {gender}

Vital Signs:
- Blood Pressure: {bp_systolic}/{bp_diastolic} mmHg
- Heart Rate: {heart_rate} bpm
- Temperature: {temperature} °C

Reported Symptoms:
{symptoms}

{report_section}

ML Model Prediction:
- Risk Level : {risk_level} (confidence: {risk_confidence}%)
- Department  : {department} (confidence: {dept_confidence}%)

Based on all of the above, provide a triage assessment.
Explain why the predicted risk level and department are appropriate for these
symptoms.  Note any additional considerations or red flags.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{{
  "risk_level": "Low" | "Moderate" | "High" | "Critical",
  "summary": "A brief 1-2 sentence summary of the patient's condition.",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "recommended_action": "What the patient should do next.",
  "urgency_score": <number from 1 to 10>
}}
"""


def _parse_bp(bp_string: str) -> tuple[float, float]:
    """Parse a blood pressure string like '120/80' into (systolic, diastolic)."""
    try:
        parts = bp_string.strip().split("/")
        systolic = float(parts[0])
        diastolic = float(parts[1]) if len(parts) > 1 else 80.0
        return systolic, diastolic
    except (ValueError, IndexError):
        return _DEFAULT_BP_SYSTOLIC, 80.0


async def _run_ml(
    age: int,
    gender: str,
    symptoms: str,
    bp_systolic: float,
    heart_rate: float,
    temperature: float,
) -> dict[str, Any] | None:
    """Run the sklearn ML predictor, returning None on any failure."""
    try:
        ml_input = {
            "age": age,
            "gender": gender,
            "symptoms": symptoms,
            "bp_systolic": bp_systolic,
            "heart_rate": heart_rate,
            "temperature": temperature,
        }
        return predictor.predict(ml_input)
    except Exception:
        logger.exception("ML prediction failed -- falling back to Gemini-only")
        return None


@router.post("/analyze")
async def analyze(
    age: int = Form(...),
    gender: str = Form(...),
    symptoms: str = Form(...),
    bp: str = Form(""),
    heart_rate: float = Form(0),
    temperature: float = Form(0),
    file: UploadFile | None = File(None),
):
    # ── 0. Parse vital signs with fallback defaults ───────────────────
    bp_systolic, bp_diastolic = _parse_bp(bp) if bp.strip() else (_DEFAULT_BP_SYSTOLIC, 80.0)
    hr = heart_rate if heart_rate > 0 else _DEFAULT_HEART_RATE
    temp = temperature if temperature > 0 else _DEFAULT_TEMPERATURE

    # ── 1. Extract optional uploaded report ────────────────────────────
    report_text = ""
    if file is not None:
        raw = await file.read()
        report_text = raw.decode("utf-8", errors="replace")

    # ── 2. ML inference (with fallback) ────────────────────────────────
    ml_result = await _run_ml(age, gender, symptoms, bp_systolic, hr, temp)

    # ── 3. LLM contextualisation via Gemini ────────────────────────────
    if ml_result is not None:
        report_section = (
            f"Attached Report:\n{report_text}" if report_text else "No report attached."
        )
        hybrid_prompt = _HYBRID_PROMPT.format(
            age=age,
            gender=gender,
            symptoms=symptoms,
            bp_systolic=bp_systolic,
            bp_diastolic=bp_diastolic,
            heart_rate=hr,
            temperature=temp,
            report_section=report_section,
            risk_level=ml_result["risk_level"],
            risk_confidence=round(ml_result["risk_confidence"] * 100, 1),
            department=ml_result["department"],
            dept_confidence=round(ml_result["department_confidence"] * 100, 1),
        )
        gemini_response = await analyze_report(
            report_text=hybrid_prompt, age=str(age), gender=gender,
        )
    else:
        # Pure Gemini fallback -- no ML prediction available
        fallback_text = f"Symptoms: {symptoms}"
        fallback_text += f"\nVitals: BP {bp_systolic}/{bp_diastolic}, HR {hr}, Temp {temp}"
        if report_text:
            fallback_text += f"\n\nAttached Report:\n{report_text}"
        gemini_response = await analyze_report(
            report_text=fallback_text, age=str(age), gender=gender,
        )

    # ── 4. Build response ──────────────────────────────────────────────
    ml_prediction = (
        {
            "risk_level": ml_result["risk_level"],
            "department": ml_result["department"],
            "risk_confidence": ml_result["risk_confidence"],
            "department_confidence": ml_result["department_confidence"],
        }
        if ml_result
        else None
    )

    return {
        "ml_prediction": ml_prediction,
        "ai_explanation": gemini_response,
        "final_recommendation": {
            "risk_level": (
                ml_result["risk_level"] if ml_result else gemini_response.get("risk_level", "Unknown")
            ),
            "department": (
                ml_result["department"] if ml_result else "General Medicine"
            ),
            "summary": gemini_response.get("summary", ""),
            "recommended_action": gemini_response.get("recommended_action", ""),
            "urgency_score": gemini_response.get("urgency_score", 5),
        },
    }
