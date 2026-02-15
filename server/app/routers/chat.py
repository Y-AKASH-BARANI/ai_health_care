import logging
import os

from fastapi import APIRouter, HTTPException
from groq import Groq
from pydantic import BaseModel

from app.firebase_setup import firestore_db

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Groq client (Llama-3)
# ---------------------------------------------------------------------------
_groq_key = os.getenv("GROQ_API_KEY")
if not _groq_key:
    logger.warning("GROQ_API_KEY is not set -- /chat endpoint will fail at runtime")

groq_client = Groq(api_key=_groq_key) if _groq_key else None

_MODEL = "llama-3.1-8b-instant"

# ---------------------------------------------------------------------------
# Request / Response
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    uid: str
    message: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fetch_history(uid: str, limit: int = 5) -> str:
    """Fetch the last *limit* triage records from Firestore and format them."""
    history_ref = (
        firestore_db.collection("users")
        .document(uid)
        .collection("history")
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
    )
    docs = history_ref.stream()

    entries: list[str] = []
    for doc in docs:
        d = doc.to_dict()
        ts = d.get("timestamp")
        date_str = ts.strftime("%Y-%m-%d %H:%M") if ts else "Unknown date"

        symptoms = d.get("symptoms", [])
        symptom_str = (
            ", ".join(symptoms) if isinstance(symptoms, list) else str(symptoms)
        )

        entry = (
            f"- Date: {date_str} | "
            f"Risk: {d.get('risk_level', 'N/A')} | "
            f"Department: {d.get('department', 'N/A')} | "
            f"Symptoms: {symptom_str} | "
            f"Summary: {d.get('summary', 'N/A')}"
        )
        entries.append(entry)

    if not entries:
        return "No previous triage history found for this patient."

    return "\n".join(entries)


_SYSTEM_PROMPT = """You are the Arogya Health Assistant, a knowledgeable and empathetic \
medical AI. You have access to this patient's triage history below.

Answer concisely (2-4 sentences) unless the patient asks for more detail. \
If the patient asks about symptoms not present in their history, use your \
medical knowledge to respond but prioritize historical context when available. \
Always recommend consulting a healthcare professional for definitive medical guidance.

--- Patient Triage History (most recent first) ---
{history}
"""


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/chat")
async def chat(request: ChatRequest):
    if groq_client is None:
        raise HTTPException(
            status_code=503,
            detail="Chat service unavailable -- GROQ_API_KEY is not configured.",
        )

    # 1. Fetch patient history from Firestore
    try:
        history_text = _fetch_history(request.uid)
    except Exception:
        logger.exception("Failed to fetch Firestore history for uid=%s", request.uid)
        history_text = "Unable to retrieve patient history at this time."

    # 2. Build system prompt with history context
    system_prompt = _SYSTEM_PROMPT.format(history=history_text)

    # 3. Call Groq (Llama-3)
    try:
        completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message},
            ],
            model=_MODEL,
        )
        reply = completion.choices[0].message.content
    except Exception:
        logger.exception("Groq chat completion failed")
        raise HTTPException(
            status_code=502,
            detail="AI assistant is temporarily unavailable. Please try again.",
        )

    return {"reply": reply}
