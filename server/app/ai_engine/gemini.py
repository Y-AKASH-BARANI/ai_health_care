import json
import logging
import os

from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise ValueError(
        "GEMINI_API_KEY is not set. "
        "Add it to server/.env or export it as an environment variable."
    )

genai.configure(api_key=_api_key)

# ---------------------------------------------------------------------------
# Dynamic Model Discovery
# ---------------------------------------------------------------------------
print("Checking available Gemini models...")
available_models: list[str] = []
try:
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            available_models.append(m.name)

    print(f"Available: {available_models}")
except Exception as e:
    print(f"Error listing models: {e}")

_PRIORITY_MODELS = [
    "models/gemini-1.5-flash",
    "models/gemini-1.5-flash-latest",
    "models/gemini-1.5-flash-001",
    "models/gemini-1.5-flash-002",
]

_selected: str | None = None
for p in _PRIORITY_MODELS:
    if p in available_models:
        _selected = p
        break

# Wildcard fallback: prefer any Flash variant over Pro to stay within free-tier
if _selected is None:
    for m in available_models:
        if "flash" in m:
            _selected = m
            break

if _selected is None:
    for m in available_models:
        if "gemini" in m:
            _selected = m
            break

if _selected:
    print(f"Selected Model: {_selected}")
    model = genai.GenerativeModel(_selected)
else:
    print("No Gemini model discovered. Hardcoding 'gemini-1.5-flash'...")
    model = genai.GenerativeModel("gemini-1.5-flash")

TRIAGE_PROMPT = """You are an AI medical triage assistant. Analyze the following patient information and medical report, then provide a triage assessment.

Patient Demographics:
- Age: {age}
- Gender: {gender}

Medical Report Content:
{report_text}

MANDATORY VITALS RULES (enforce strictly):
- Blood Pressure, Heart Rate, and Temperature are mandatory clinical inputs.
- Weigh these vitals heavily when determining risk_level and urgency_score.
- If Heart Rate > 120 bpm OR BP > 160/100 mmHg, risk_level MUST be "High" or "Critical".
- If Temperature > 39.5 °C OR < 35.0 °C, risk_level MUST be at least "High".
- If Heart Rate > 150 bpm OR BP > 180/120 mmHg, risk_level MUST be "Critical".

CONFIDENCE SCORE RULES:
- 30 if ONLY symptoms/history are provided (no vitals, no document).
- 70 if symptoms AND all mandatory vitals (BP, HR, Temp) are provided.
- 95 if symptoms AND vitals AND a medical document (EHR/EMR) are provided.

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


async def analyze_report(report_text: str, age: str, gender: str) -> dict:
    prompt = TRIAGE_PROMPT.format(
        age=age,
        gender=gender,
        report_text=report_text,
    )

    response = await model.generate_content_async(prompt)
    text = response.text.strip()

    # Strip markdown code fences if the model adds them
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    text = text.strip()

    return json.loads(text)


logger = logging.getLogger(__name__)

_DOCUMENT_PROMPT = """You are a medical data extraction assistant.
Analyze the attached medical document. Extract all clinically relevant data.
Focus on: current symptoms, vital signs (Blood Pressure, Heart Rate, Temperature),
diagnoses, medications, and pre-existing conditions.
Ignore administrative headers, footers, patient ID numbers, and billing codes.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{{
  "extracted_symptoms": "comma-separated list of symptoms found, or empty string",
  "extracted_conditions": "comma-separated list of pre-existing conditions, or empty string",
  "extracted_vitals": {{
    "bp": "systolic/diastolic if found, or empty string",
    "heart_rate": "value if found, or empty string",
    "temperature": "value if found, or empty string"
  }},
  "document_summary": "A brief 2-3 sentence clinical summary of the document."
}}
"""


def _parse_gemini_json(text: str) -> dict:
    """Strip markdown fences and parse JSON from Gemini output."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return json.loads(text.strip())


async def analyze_document_image(image_bytes: bytes, mime_type: str) -> dict:
    """Use Gemini Vision to extract clinical data from a medical image.

    Parameters
    ----------
    image_bytes : bytes
        Raw bytes of the image file.
    mime_type : str
        MIME type (e.g. "image/png", "image/jpeg").

    Returns
    -------
    dict
        Extracted clinical data with keys: extracted_symptoms,
        extracted_conditions, extracted_vitals, document_summary.
    """
    image_part = {"mime_type": mime_type, "data": image_bytes}
    try:
        response = await model.generate_content_async([_DOCUMENT_PROMPT, image_part])
        return _parse_gemini_json(response.text)
    except Exception:
        logger.exception("Gemini Vision document analysis failed")
        return {
            "extracted_symptoms": "",
            "extracted_conditions": "",
            "extracted_vitals": {"bp": "", "heart_rate": "", "temperature": ""},
            "document_summary": "",
        }


async def analyze_document_text(document_text: str) -> dict:
    """Use Gemini to extract clinical data from document text (e.g. PDF).

    Parameters
    ----------
    document_text : str
        Plain text extracted from a PDF.

    Returns
    -------
    dict
        Same structure as analyze_document_image.
    """
    prompt = _DOCUMENT_PROMPT + f"\n\nDocument Content:\n{document_text}"
    try:
        response = await model.generate_content_async(prompt)
        return _parse_gemini_json(response.text)
    except Exception:
        logger.exception("Gemini document text analysis failed")
        return {
            "extracted_symptoms": "",
            "extracted_conditions": "",
            "extracted_vitals": {"bp": "", "heart_rate": "", "temperature": ""},
            "document_summary": "",
        }

