"use client";

import { useUserStore } from "@/store/userStore";
import UserHealthCard from "@/components/ui/UserHealthCard";

/* ──────────────────────────────────────────────
   Mock timeline data
   ────────────────────────────────────────────── */
interface TimelineEntry {
    id: string;
    date: string;
    symptoms: string;
    risk: "LOW" | "MEDIUM" | "HIGH";
    department: string;
    insight: string;
}

const TIMELINE: TimelineEntry[] = [
    {
        id: "1",
        date: "Feb 14, 2026",
        symptoms: "Chest pain, dizziness, elevated heart rate",
        risk: "HIGH",
        department: "Cardiology",
        insight:
            "Elevated systolic BP combined with severe pain score suggests urgent cardiac evaluation.",
    },
    {
        id: "2",
        date: "Feb 10, 2026",
        symptoms: "Persistent cough, mild fever, fatigue",
        risk: "MEDIUM",
        department: "Pulmonology",
        insight:
            "Symptom duration exceeding 5 days with low-grade fever warrants respiratory assessment.",
    },
    {
        id: "3",
        date: "Feb 03, 2026",
        symptoms: "Mild headache, nasal congestion",
        risk: "LOW",
        department: "General Medicine",
        insight:
            "Symptom profile consistent with seasonal allergy. No escalation needed.",
    },
    {
        id: "4",
        date: "Jan 27, 2026",
        symptoms: "Abdominal discomfort, nausea",
        risk: "MEDIUM",
        department: "Gastroenterology",
        insight:
            "Recurrent pattern detected — recommend follow-up with dietary assessment.",
    },
    {
        id: "5",
        date: "Jan 18, 2026",
        symptoms: "Lower back pain, stiffness",
        risk: "LOW",
        department: "Orthopedics",
        insight:
            "Mechanical pain pattern with no neurological flags. Conservative management advised.",
    },
    {
        id: "6",
        date: "Jan 05, 2026",
        symptoms: "Skin rash, mild itching on forearms",
        risk: "LOW",
        department: "Dermatology",
        insight:
            "Localized contact dermatitis likely. No systemic involvement detected.",
    },
];

const RISK_BADGE: Record<string, string> = {
    LOW: "bg-emerald-600 text-white",
    MEDIUM: "bg-amber-600 text-white",
    HIGH: "bg-rose-600 text-white",
};

const RISK_DOT: Record<string, string> = {
    LOW: "bg-emerald-500",
    MEDIUM: "bg-amber-500",
    HIGH: "bg-rose-500",
};

export default function DashboardPage() {
    const { displayName, photoURL, age, gender } = useUserStore();

    const currentRisk = TIMELINE[0]?.risk ?? "LOW";

    return (
        <div className="flex flex-1 flex-col lg:flex-row">
            {/* ─── LEFT PANEL ─── */}
            <aside className="w-full border-b border-zinc-800/40 px-6 py-10 lg:w-[30%] lg:min-w-[300px] lg:border-b-0 lg:border-r lg:px-8">
                <UserHealthCard
                    displayName={displayName}
                    photoURL={photoURL}
                    age={age}
                    gender={gender}
                    riskLevel={currentRisk}
                    lastTriageDate="Feb 14, 2026"
                    totalSessions={TIMELINE.length}
                />
            </aside>

            {/* ─── RIGHT PANEL ─── */}
            <main className="flex-1 px-6 py-10 lg:px-10">
                {/* Section Title */}
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-zinc-200">
                        Health Memory Timeline
                    </h2>
                    <span className="text-xs text-zinc-600">
                        {TIMELINE.length} records
                    </span>
                </div>

                {/* Timeline */}
                <div className="relative border-l border-zinc-800/60 pl-8">
                    {TIMELINE.map((entry) => (
                        <div key={entry.id} className="group relative mb-8 last:mb-0">
                            <span
                                className={`absolute -left-[41px] top-4 h-3 w-3 rounded-full border-2 border-slate-950 ${RISK_DOT[entry.risk]}`}
                            />

                            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700/60 hover:bg-zinc-900/60">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">{entry.date}</span>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${RISK_BADGE[entry.risk]}`}
                                    >
                                        {entry.risk}
                                    </span>
                                </div>

                                <p className="text-sm font-medium text-zinc-200">
                                    {entry.symptoms}
                                </p>

                                <p className="mt-2 text-xs text-zinc-500">
                                    Dept: {entry.department}
                                </p>

                                <div className="mt-3 rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-3 py-2.5">
                                    <p className="text-[11px] leading-relaxed text-zinc-500">
                                        <span className="mr-1 font-semibold text-zinc-400">
                                            AI Insight:
                                        </span>
                                        {entry.insight}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
