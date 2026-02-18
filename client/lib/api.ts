import type { TriageResult } from "@/store/userStore";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ||"http://127.0.0.1:8000";

interface AnalyzeParams {
  age: string;
  gender: string;
  symptoms: string[];
  conditions: string[];
  bp?: string;
  heartRate?: string;
  temperature?: string;
  file?: File | null;
}

export async function analyzePatient({
  age,
  gender,
  symptoms,
  conditions,
  bp,
  heartRate,
  temperature,
  file,
}: AnalyzeParams): Promise<TriageResult> {
  const formData = new FormData();
  formData.append("age", age || "0");
  formData.append("gender", gender || "Unknown");
  formData.append("symptoms", symptoms.join(", "));
  formData.append("conditions", conditions.join(", "));
  if (bp) {
    formData.append("bp", bp);
  }
  if (heartRate) {
    formData.append("heart_rate", heartRate);
  }
  if (temperature) {
    formData.append("temperature", temperature);
  }
  if (file) {
    formData.append("file", file);
  }

  const res = await fetch(`${API_BASE}/api/triage/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function sendChatMessage(
  uid: string,
  message: string,
): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Chat request failed with status ${res.status}`);
  }

  return res.json();
}
