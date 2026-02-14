"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Stethoscope, ArrowLeft } from "lucide-react";
import { useUserStore } from "@/store/userStore";

const RISK_COLORS: Record<string, string> = {
    High: "text-red-400",
    Medium: "text-yellow-400",
    Low: "text-emerald-400",
};

export default function ResultPage() {
    const router = useRouter();
    const triageResult = useUserStore((s) => s.triageResult);

    if (!triageResult) {
        return (
            <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
                <p className="text-zinc-400">No triage result available.</p>
                <button
                    onClick={() => router.push("/triage")}
                    className="mt-4 text-sm font-medium text-emerald-400 underline underline-offset-4 hover:text-emerald-300"
                >
                    Go back to triage
                </button>
            </div>
        );
    }

    const riskColor = RISK_COLORS[triageResult.final_recommendation.risk_level] ?? "text-yellow-400";

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
                    <h1 className="text-2xl font-bold text-white">Triage Result</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        AI-generated clinical assessment
                    </p>
                </div>

                {/* Result Card */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-xl">
                    {/* Risk Level */}
                    <div className="mb-6 flex items-center gap-3">
                        <AlertTriangle className={`h-6 w-6 ${riskColor}`} />
                        <span className={`text-lg font-bold ${riskColor}`}>
                            {triageResult.final_recommendation.risk_level} Risk
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
                                {triageResult.final_recommendation.department}
                            </p>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="rounded-lg border border-zinc-800 bg-black/50 p-4">
                        <h3 className="mb-1 text-sm font-medium text-zinc-400">
                            Explanation
                        </h3>
                        <p className="text-sm leading-relaxed text-white">
                            {triageResult.ai_explanation.summary}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-4">
                    <button
                        onClick={() => router.push("/triage")}
                        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        New Triage
                    </button>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex-1 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
