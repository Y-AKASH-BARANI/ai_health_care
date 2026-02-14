"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, Stethoscope } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { analyzePatient } from "@/lib/api";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import FileUpload from "@/components/triage/FileUpload";
import SymptomSelect from "@/components/triage/SymptomSelect";
import ConditionSelect from "@/components/triage/ConditionSelect";

export default function Triage() {
  const { displayName, age, gender, uid, triageResult, setTriageResult } =
    useUserStore();

  const [file, setFile] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
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
        file,
      });

      setTriageResult(data);

      // Save to Firestore
      if (uid) {
        await addDoc(collection(db, "users", uid, "history"), {
          timestamp: serverTimestamp(),
          symptoms,
          conditions,
          risk_level: data.risk_level,
          department: data.department,
          explanation: data.explanation,
          fileName: file?.name || null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

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

        {/* Results Card */}
        <AnimatePresence>
          {triageResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-xl"
            >
              {/* Risk Level */}
              <div className="mb-6 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                <span className="text-lg font-bold text-yellow-400">
                  {triageResult.risk_level} Risk
                </span>
              </div>

              {/* Department */}
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-zinc-400">
                  Recommended Department
                </h3>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-400" />
                  <p className="text-sm font-medium text-white">
                    {triageResult.department}
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="rounded-lg border border-zinc-800 bg-black/50 p-4">
                <h3 className="mb-1 text-sm font-medium text-zinc-400">
                  Explanation
                </h3>
                <p className="text-sm leading-relaxed text-white">
                  {triageResult.explanation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
