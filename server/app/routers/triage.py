import logging
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.ai_engine.gemini import analyze_document_image, analyze_document_text, analyze_report
from ml_core.inference import predictor
from utils.text_processing import extract_text_from_pdf, is_image, is_pdf

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

Vital Signs (MANDATORY — weigh heavily in risk assessment):
- Blood Pressure: {bp_systolic}/{bp_diastolic} mmHg
- Heart Rate: {heart_rate} bpm
- Temperature: {temperature} °C

Reported Symptoms:
{symptoms}

Pre-existing Conditions:
{conditions}

{report_section}

ML Model Prediction:
- Risk Level : {risk_level} (confidence: {risk_confidence}%)
- Department  : {department} (confidence: {dept_confidence}%)

MANDATORY VITALS RULES (enforce strictly):
- If Heart Rate > 120 bpm OR BP > 160/100 mmHg, risk_level MUST be "High" or "Critical".
- If Temperature > 39.5 °C OR < 35.0 °C, risk_level MUST be at least "High".
- If Heart Rate > 150 bpm OR BP > 180/120 mmHg, risk_level MUST be "Critical".

CONFIDENCE SCORE RULES:
- 30 if ONLY symptoms/history are provided (no vitals, no document).
- 70 if symptoms AND all mandatory vitals (BP, HR, Temp) are provided.
- 95 if symptoms AND vitals AND a medical document (EHR/EMR) are provided.

Based on all of the above, provide a triage assessment.
Explain why the predicted risk level and department are appropriate for these
symptoms.  Note any additional considerations or red flags.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{{
  "risk_level": "Low" | "Moderate" | "High" | "Critical",
  "summary": "A brief 1-2 sentence summary of the patient's condition.",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "recommended_action": "What the patient should do next.",
  "urgency_score": <number from 1 to 10>,
  "risk_factors": ["specific risk factor 1", "specific risk factor 2", "specific risk factor 3"],
  "vital_analysis": [
    {{"name": "Blood Pressure", "value": "120/80 mmHg", "status": "normal" | "warning" | "critical", "score": <0-100>}},
    {{"name": "Heart Rate", "value": "80 bpm", "status": "normal" | "warning" | "critical", "score": <0-100>}},
    {{"name": "Temperature", "value": "37.0 °C", "status": "normal" | "warning" | "critical", "score": <0-100>}}
  ],
  "dept_insights": {{
    "department_name": "The recommended department name",
    "wait_time_estimate": "Estimated wait time e.g. '15-30 minutes'",
    "immediate_action": "What to do right now before seeing a doctor",
    "specialist_type": "Type of specialist e.g. 'Cardiologist'"
  }},
  "care_plan": {{
    "care_instructions": ["3-4 specific care instructions based on the diagnosis"],
    "dietary_recommendations": ["3-4 foods or drinks that help with recovery"],
    "dietary_restrictions": ["3-4 foods or substances to strictly avoid"]
  }},
  "confidence_score": <integer 0-100 using the CONFIDENCE SCORE RULES above>
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
    symptoms: str = Form(""),
    conditions: str = Form(""),
    bp: str = Form(""),
    heart_rate: float = Form(0),
    temperature: float = Form(0),
    file: UploadFile | None = File(None),
):
    # ── 0. Validate mandatory vital signs ──────────────────────────────
    missing: list[str] = []
    if not bp.strip():
        missing.append("Blood Pressure")
    if heart_rate <= 0:
        missing.append("Heart Rate")
    if temperature <= 0:
        missing.append("Temperature")
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Mandatory clinical data missing: {', '.join(missing)}.",
        )

    bp_systolic, bp_diastolic = _parse_bp(bp)
    hr = heart_rate
    temp = temperature

    # ── 1. Process optional uploaded document ───────────────────────
    report_text = ""
    doc_extraction: dict | None = None
    if file is not None:
        raw = await file.read()
        filename = file.filename or ""
        content_type = file.content_type or ""

        if is_pdf(filename):
            # Extract text from PDF, then use Gemini to parse clinical data
            pdf_text = extract_text_from_pdf(raw)
            if pdf_text:
                report_text = pdf_text
                doc_extraction = await analyze_document_text(pdf_text)
            else:
                logger.warning("PDF had no extractable text -- skipping document analysis")
        elif is_image(filename):
            # Pass image bytes directly to Gemini Vision (multimodal)
            mime = content_type if content_type.startswith("image/") else "image/png"
            doc_extraction = await analyze_document_image(raw, mime)
            report_text = doc_extraction.get("document_summary", "")
        else:
            # Fallback: try to decode as UTF-8 text
            report_text = raw.decode("utf-8", errors="replace")

    # ── 1b. Merge document-extracted data with form inputs ─────────
    if doc_extraction:
        extracted_symptoms = doc_extraction.get("extracted_symptoms", "")
        if extracted_symptoms:
            symptoms = f"{symptoms}. Document findings: {extracted_symptoms}"

        extracted_conditions = doc_extraction.get("extracted_conditions", "")
        if extracted_conditions and not conditions:
            conditions = extracted_conditions

        vitals = doc_extraction.get("extracted_vitals", {})
        if vitals.get("bp") and not bp.strip():
            bp_systolic, bp_diastolic = _parse_bp(vitals["bp"])
        if vitals.get("heart_rate") and hr == _DEFAULT_HEART_RATE:
            try:
                hr = float(vitals["heart_rate"])
            except ValueError:
                pass
        if vitals.get("temperature") and temp == _DEFAULT_TEMPERATURE:
            try:
                temp = float(vitals["temperature"])
            except ValueError:
                pass

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
            conditions=conditions if conditions else "None reported",
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
        if conditions:
            fallback_text += f"\nPre-existing Conditions: {conditions}"
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

    response = {
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
        "risk_factors": gemini_response.get("risk_factors", []),
        "vital_analysis": gemini_response.get("vital_analysis", []),
        "dept_insights": gemini_response.get("dept_insights", {}),
        "care_plan": gemini_response.get("care_plan", {
            "care_instructions": [],
            "dietary_recommendations": [],
            "dietary_restrictions": [],
        }),
        "confidence_score": gemini_response.get("confidence_score", 50),
    }

    return response
