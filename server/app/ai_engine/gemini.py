import json
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
    "models/gemini-1.5-pro",
    "models/gemini-pro",
    "models/gemini-1.0-pro",
]

_selected: str | None = None
for p in _PRIORITY_MODELS:
    if p in available_models:
        _selected = p
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
    print("No specific Gemini model found. Trying default 'gemini-1.5-flash'...")
    model = genai.GenerativeModel("gemini-1.5-flash")

TRIAGE_PROMPT = """You are an AI medical triage assistant. Analyze the following patient information and medical report, then provide a triage assessment.

Patient Demographics:
- Age: {age}
- Gender: {gender}

Medical Report Content:
{report_text}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{{
  "risk_level": "Low" | "Moderate" | "High" | "Critical",
  "summary": "A brief 1-2 sentence summary of the patient's condition.",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "recommended_action": "What the patient should do next.",
  "urgency_score": <number from 1 to 10>
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
