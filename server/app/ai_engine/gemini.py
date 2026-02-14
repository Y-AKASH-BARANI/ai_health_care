import google.generativeai as genai
import os
import json

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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
