"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Stethoscope, ArrowLeft, Gauge } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import RiskFactors from "@/components/result/RiskFactors";
import VitalViz from "@/components/result/VitalViz";
import DepartmentCard from "@/components/result/DepartmentCard";
import CarePlanCard from "@/components/result/CarePlanCard";

const RISK_COLORS: Record<string, string> = {
    High: "text-red-400",
    Critical: "text-red-500",
    Moderate: "text-yellow-400",
    Low: "text-emerald-400",
};

const RISK_BG: Record<string, string> = {
    High: "bg-red-500/10 border-red-500/30",
    Critical: "bg-red-600/10 border-red-600/30",
    Moderate: "bg-yellow-500/10 border-yellow-500/30",
    Low: "bg-emerald-500/10 border-emerald-500/30",
};

function ConfidenceGauge({ score }: { score: number }) {
    const clamped = Math.max(0, Math.min(100, score));
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;
    const color =
        clamped >= 80
            ? "text-emerald-400 stroke-emerald-400"
            : clamped >= 50
              ? "text-yellow-400 stroke-yellow-400"
              : "text-red-400 stroke-red-400";

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-zinc-800"
                />
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={color}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
                <text
                    x="48"
                    y="48"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`fill-current ${color.split(" ")[0]} rotate-90 origin-center`}
                    style={{ fontSize: "18px", fontWeight: 700 }}
                >
                    {clamped}%
                </text>
            </svg>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Confidence
            </span>
        </div>
    );
}

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

    const rec = triageResult.final_recommendation;
    const riskColor = RISK_COLORS[rec.risk_level] ?? "text-yellow-400";
    const riskBg = RISK_BG[rec.risk_level] ?? "bg-yellow-500/10 border-yellow-500/30";

    return (
        <div className="flex flex-col items-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-3xl space-y-6"
            >
                {/* Page Heading */}
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Triage Analytics
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        AI-generated clinical assessment with advanced analytics
                    </p>
                </div>

                {/* ── Top Row: Risk Badge + Confidence + Department ── */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* Risk Badge */}
                    <div
                        className={`flex items-center gap-4 rounded-xl border p-5 backdrop-blur-xl ${riskBg}`}
                    >
                        <AlertTriangle className={`h-8 w-8 ${riskColor}`} />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Risk Level
                            </p>
                            <p className={`text-xl font-bold ${riskColor}`}>
                                {rec.risk_level}
                            </p>
                        </div>
                    </div>

                    {/* Confidence Gauge */}
                    <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-xl">
                        <ConfidenceGauge score={triageResult.confidence_score} />
                    </div>

                    {/* Urgency + Department quick card */}
                    <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur-xl">
                        <Stethoscope className="h-8 w-8 text-blue-400" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                Department
                            </p>
                            <p className="text-lg font-bold text-white">
                                {rec.department}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <Gauge className="h-3 w-3 text-zinc-500" />
                                <span className="text-xs text-zinc-500">
                                    Urgency: {rec.urgency_score}/10
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Summary Card ── */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        Summary
                    </h3>
                    <p className="text-sm leading-relaxed text-white">
                        {rec.summary}
                    </p>
                    {rec.recommended_action && (
                        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                            <p className="text-xs font-medium text-emerald-400">
                                Recommended Action
                            </p>
                            <p className="mt-1 text-sm text-zinc-300">
                                {rec.recommended_action}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Middle Row: Risk Factors + Dept Insights ── */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <RiskFactors factors={triageResult.risk_factors} />
                    <DepartmentCard insights={triageResult.dept_insights} />
                </div>

                {/* ── Bottom: Vital Signs Analysis ── */}
                <VitalViz vitals={triageResult.vital_analysis} />

                {/* ── Personalized Care Plan ── */}
                <CarePlanCard plan={triageResult.care_plan} />

                {/* ── Key Findings ── */}
                {triageResult.ai_explanation.key_findings?.length > 0 && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                            Key Findings
                        </h3>
                        <ul className="space-y-2">
                            {triageResult.ai_explanation.key_findings.map(
                                (finding, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-zinc-300"
                                    >
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                        {finding}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex gap-4">
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
