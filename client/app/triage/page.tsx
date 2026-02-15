"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { analyzePatient } from "@/lib/api";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import FileUpload from "@/components/triage/FileUpload";
import SymptomSelect from "@/components/triage/SymptomSelect";
import ConditionSelect from "@/components/triage/ConditionSelect";

export default function Triage() {
  const router = useRouter();
  const { displayName, age, gender, uid, setTriageResult } =
    useUserStore();

  const [file, setFile] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [bp, setBp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const vitalsComplete = bp.trim() !== "" && heartRate.trim() !== "" && temperature.trim() !== "";

  async function handleSubmit() {
    if (symptoms.length === 0 && !file) {
      setError("Please select at least one symptom or upload a medical report.");
      return;
    }
    if (!vitalsComplete) {
      setError("Blood Pressure, Heart Rate, and Temperature are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await analyzePatient({
        age,
        gender,
        symptoms,
        conditions,
        bp,
        heartRate,
        temperature,
        file,
      });

      // Save session to Firestore via client SDK so the local cache
      // is updated immediately and onSnapshot listeners pick it up.
      if (uid) {
        const rec = data.final_recommendation;
        await addDoc(collection(db, "users", uid, "history"), {
          timestamp: serverTimestamp(),
          symptoms,
          conditions,
          risk_level: rec.risk_level,
          department: rec.department,
          summary: rec.summary,
          recommended_action: rec.recommended_action,
          urgency_score: rec.urgency_score,
          confidence_score: data.confidence_score,
          ml_prediction: data.ml_prediction,
          fileName: file?.name ?? null,
        });

        // Increment session count on user document
        await setDoc(doc(db, "users", uid), {
          sessionCount: increment(1),
          lastTriageDate: serverTimestamp(),
          lastRiskLevel: rec.risk_level,
        }, { merge: true });
      }

      setTriageResult(data);
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center px-4 py-12 no-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Patient Triage</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Select your symptoms for AI analysis
            {displayName ? `, ${displayName}` : ""}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-xl">
          {/* Symptoms */}
          <div className="mb-6">
            <SymptomSelect selected={symptoms} onChange={setSymptoms} />
          </div>

          {/* Conditions */}
          <div className="mb-6">
            <ConditionSelect selected={conditions} onChange={setConditions} />
          </div>

          {/* Layout: Vitals (Left) + File Upload (Right) */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Vital Signs */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-zinc-300">
                Vital Signs <span className="text-red-400">*Required</span>
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="bp"
                    className="mb-1 block text-xs text-zinc-500"
                  >
                    Blood Pressure <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="bp"
                    type="text"
                    placeholder="e.g., 120/80"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="heartRate"
                    className="mb-1 block text-xs text-zinc-500"
                  >
                    Heart Rate (bpm) <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="heartRate"
                    type="number"
                    placeholder="e.g., 72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="no-spin-button w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="temperature"
                    className="mb-1 block text-xs text-zinc-500"
                  >
                    Temperature (°C) <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 37.0"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="no-spin-button w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* File Upload (Optional) */}
            <div className="flex flex-col">
              <h3 className="mb-3 text-sm font-medium text-zinc-300">
                Medical Report <span className="text-zinc-500 text-xs">(Optional)</span>
              </h3>
              <div className="h-full">
                <FileUpload
                  file={file}
                  onFileChange={setFile}
                  onError={setError}
                  className="h-full justify-center"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !vitalsComplete}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
