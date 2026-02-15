"use client";

import { useRouter } from "next/navigation";

interface UserHealthCardProps {
    displayName: string;
    photoURL: string;
    age: string;
    gender: string;
    riskLevel: string;
    lastTriageDate?: string;
    totalSessions?: number;
}

const RISK_DOT: Record<string, string> = {
    LOW: "bg-emerald-500",
    MEDIUM: "bg-amber-500",
    HIGH: "bg-rose-500",
};

const RISK_LABEL: Record<string, string> = {
    LOW: "Stable",
    MEDIUM: "Moderate Risk",
    HIGH: "High Alert",
};

export default function UserHealthCard({
    displayName,
    photoURL,
    age,
    gender,
    riskLevel,
    lastTriageDate = "—",
    totalSessions = 0,
}: UserHealthCardProps) {
    const router = useRouter();

    const initials = displayName
        ? displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U";

    const riskKey = riskLevel.toUpperCase();

    return (
        <div className="w-full rounded-2xl border border-zinc-800/60 bg-slate-900/60 p-8 shadow-md backdrop-blur-sm">
            {/* ── Profile ── */}
            <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border border-zinc-700/50 bg-gradient-to-br from-slate-700 to-slate-800">
                    {photoURL ? (
                        <img
                            src={photoURL}
                            alt={displayName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-bold text-zinc-300">{initials}</span>
                    )}
                </div>

                {/* Name & Demographics */}
                <h2 className="mt-5 text-lg font-bold text-white">
                    {displayName || "Patient"}
                </h2>
                {(age || gender) && (
                    <p className="mt-1 text-sm text-zinc-500">
                        {age}
                        {age && gender ? " • " : ""}
                        {gender && <span className="capitalize">{gender}</span>}
                    </p>
                )}
            </div>

            {/* ── Divider ── */}
            <div className="my-6 h-px bg-zinc-800/60" />

            {/* ── Risk Status ── */}
            <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                    Current Risk Status
                </p>
                <div className="flex items-center gap-2.5">
                    <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${RISK_DOT[riskKey] ?? "bg-zinc-500"}`}
                    />
                    <span className="text-sm font-medium text-zinc-300">
                        {RISK_LABEL[riskKey] ?? riskLevel}
                    </span>
                </div>
            </div>

            {/* ── Divider ── */}
            <div className="my-6 h-px bg-zinc-800/60" />

            {/* ── Primary Action ── */}
            <button
                onClick={() => router.push("/triage")}
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700"
            >
                + Start New Triage
            </button>

            {/* ── Metadata ── */}
            <div className="mt-6 flex justify-between text-[11px] text-zinc-600">
                <span>Last Triage: {lastTriageDate}</span>
                <span>Sessions: {totalSessions}</span>
            </div>
        </div>
    );
}
