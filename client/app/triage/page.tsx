"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  Stethoscope,
  ShieldCheck,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { analyzePatient } from "@/lib/api";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import FileUpload from "@/components/triage/FileUpload";
import SymptomSelect from "@/components/triage/SymptomSelect";
import ConditionSelect from "@/components/triage/ConditionSelect";

const RISK_STYLES: Record<string, { badge: string; icon: string }> = {
  Low: {
    badge: "border-green-500/30 bg-green-500/10 text-green-400",
    icon: "text-green-400",
  },
  Moderate: {
    badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    icon: "text-yellow-400",
  },
  Medium: {
    badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    icon: "text-yellow-400",
  },
  High: {
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: "text-red-400",
  },
  Critical: {
    badge: "border-red-600/40 bg-red-600/20 text-red-300",
    icon: "text-red-300",
  },
};

function getRiskStyle(level: string) {
  return (
    RISK_STYLES[level] ?? {
      badge: "border-zinc-600 bg-zinc-800 text-zinc-300",
      icon: "text-zinc-400",
    }
  );
}

export default function Triage() {
  const { displayName, age, gender, uid, triageResult, setTriageResult } =
    useUserStore();

  const [file, setFile] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [bp, setBp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (symptoms.length === 0) {
      setError("Please select at least one symptom.");
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

      setTriageResult(data);

      // Save to Firestore
      if (uid) {
        await addDoc(collection(db, "users", uid, "history"), {
          timestamp: serverTimestamp(),
          symptoms,
          conditions,
          risk_level: data.final_recommendation.risk_level,
          department: data.final_recommendation.department,
          explanation: data.final_recommendation.summary,
          fileName: file?.name || null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const rec = triageResult?.final_recommendation;
  const ml = triageResult?.ml_prediction;
  const ai = triageResult?.ai_explanation;
  const riskStyle = rec ? getRiskStyle(rec.risk_level) : null;

  return (
    <div className="flex flex-col items-center px-4 py-12">
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

          {/* Vital Signs */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-zinc-300">
              Vital Signs{" "}
              <span className="text-zinc-500">(optional)</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="bp"
                  className="mb-1 block text-xs text-zinc-500"
                >
                  Blood Pressure
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
                  Heart Rate (bpm)
                </label>
                <input
                  id="heartRate"
                  type="number"
                  placeholder="e.g., 72"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="temperature"
                  className="mb-1 block text-xs text-zinc-500"
                >
                  Temperature (°C)
                </label>
                <input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 37.0"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* File Upload (Optional) */}
          <FileUpload file={file} onFileChange={setFile} onError={setError} />

          {error && (
            <p className="mt-4 text-center text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
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

        {/* Results */}
        <AnimatePresence>
          {triageResult && rec && riskStyle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="mt-8 flex flex-col gap-4"
            >
              {/* Risk + Department header card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Risk badge */}
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-6 w-6 ${riskStyle.icon}`} />
                    <span
                      className={`rounded-full border px-4 py-1 text-sm font-bold ${riskStyle.badge}`}
                    >
                      {rec.risk_level} Risk
                    </span>
                    {rec.urgency_score != null && (
                      <span className="text-xs text-zinc-500">
                        Urgency {rec.urgency_score}/10
                      </span>
                    )}
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">
                      {rec.department}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                {rec.summary && (
                  <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                    {rec.summary}
                  </p>
                )}
              </div>

              {/* ML Prediction card */}
              {ml && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
                  <div className="mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-zinc-300">
                      ML Model Prediction
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
                      <p className="text-xs text-zinc-500">Risk Level</p>
                      <p className="text-sm font-medium text-white">
                        {ml.risk_level}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-purple-500"
                          style={{
                            width: `${(ml.risk_confidence * 100).toFixed(0)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {(ml.risk_confidence * 100).toFixed(1)}% confidence
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
                      <p className="text-xs text-zinc-500">Department</p>
                      <p className="text-sm font-medium text-white">
                        {ml.department}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{
                            width: `${(ml.department_confidence * 100).toFixed(0)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {(ml.department_confidence * 100).toFixed(1)}% confidence
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Explanation card */}
              {ai && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-zinc-300">
                      AI Explanation
                    </h3>
                  </div>

                  {/* Key Findings */}
                  {ai.key_findings && ai.key_findings.length > 0 && (
                    <ul className="mb-4 flex flex-col gap-1.5">
                      {ai.key_findings.map((finding, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="text-sm text-zinc-300">
                            {finding}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Recommended Action */}
                  {rec.recommended_action && (
                    <div className="rounded-lg border border-zinc-800 bg-black/40 p-4">
                      <p className="mb-1 text-xs font-medium text-zinc-500">
                        Recommended Action
                      </p>
                      <p className="text-sm leading-relaxed text-white">
                        {rec.recommended_action}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
