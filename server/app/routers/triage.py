from fastapi import APIRouter, UploadFile, File, Form

router = APIRouter()


@router.post("/analyze")
async def analyze(
    age: int = Form(...),
    gender: str = Form(...),
    symptoms: str = Form(...),
    file: UploadFile | None = File(None),
):
    print("--- Received Triage Request ---")
    print(f"Age: {age}")
    print(f"Gender: {gender}")
    print(f"Symptoms: {symptoms}")
    print(f"File: {file.filename if file else 'None'}")
    print("-------------------------------")

    return {
        "risk_level": "Medium",
        "department": "General Medicine",
        "explanation": "Patient reports fever and mild headache. AI Model is currently pending integration.",
    }
