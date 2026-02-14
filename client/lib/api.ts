const API_BASE = "http://127.0.0.1:8000";

interface AnalyzeParams {
  age: string;
  gender: string;
  symptoms: string[];
  conditions: string[];
  file?: File | null;
}

export async function analyzePatient({
  age,
  gender,
  symptoms,
  conditions,
  file,
}: AnalyzeParams) {
  const formData = new FormData();
  formData.append("age", age || "0");
  formData.append("gender", gender || "Unknown");
  formData.append(
    "symptoms",
    `Symptoms: ${symptoms.join(", ")}. Pre-existing conditions: ${conditions.join(", ")}.`
  );
  if (file) {
    formData.append("file", file);
  }

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}
