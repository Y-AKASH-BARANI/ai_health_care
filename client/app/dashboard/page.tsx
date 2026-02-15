"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import UserHealthCard from "@/components/ui/UserHealthCard";

interface HistoryEntry {
  id: string;
  symptoms: string[];
  conditions: string[];
  risk_level: string;
  department: string;
  summary: string;
  recommended_action: string;
  urgency_score: number;
  fileName: string | null;
  timestamp: Timestamp | null;
}

const RISK_BADGE: Record<string, string> = {
  Low: "bg-emerald-600 text-white",
  Moderate: "bg-amber-600 text-white",
  Medium: "bg-amber-600 text-white",
  High: "bg-rose-600 text-white",
  Critical: "bg-red-700 text-white",
};

const RISK_DOT: Record<string, string> = {
  Low: "bg-emerald-500",
  Moderate: "bg-amber-500",
  Medium: "bg-amber-500",
  High: "bg-rose-500",
  Critical: "bg-red-600",
};

function getRiskBadge(level: string) {
  return RISK_BADGE[level] ?? "bg-zinc-600 text-white";
}

function getRiskDot(level: string) {
  return RISK_DOT[level] ?? "bg-zinc-500";
}

export default function DashboardPage() {
  const router = useRouter();
  const { displayName, photoURL, age, gender, uid, sessionCount, setSessionCount } = useUserStore();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!uid) {
      router.push("/");
    }
  }, [uid, router]);

  // Real-time listener on user document for sessionCount
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(doc(db, "users", uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.sessionCount === "number") {
          setSessionCount(data.sessionCount);
        }
      }
    }, (error) => {
      console.warn("User doc listener error:", error.message);
    });

    return () => unsubscribe();
  }, [uid, setSessionCount]);

  useEffect(() => {
    if (!uid) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, "users", uid, "history"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: HistoryEntry[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HistoryEntry[];
      setHistory(entries);
    }, (error) => {
      console.warn("History listener error:", error.message);
    });

    return () => unsubscribe();
  }, [uid]);

  const currentRisk = history[0]?.risk_level ?? "Low";
  const lastDate = history[0]?.timestamp
    ? history[0].timestamp.toDate().toLocaleDateString("en-US")
    : "No sessions yet";

  if (!uid) return null;

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <aside className="w-full border-b border-zinc-800/40 px-6 py-10 lg:w-[30%] lg:min-w-[300px] lg:border-b-0 lg:border-r lg:px-8">
        <UserHealthCard
          displayName={displayName}
          photoURL={photoURL}
          age={age}
          gender={gender}
          riskLevel={currentRisk}
          lastTriageDate={lastDate}
          totalSessions={sessionCount > 0 ? sessionCount : history.length}
        />
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex-1 px-6 py-10 lg:px-10">
        {/* Section Title */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-200">
            Health Memory Timeline
          </h2>
          <span className="text-xs text-zinc-600">
            {history.length} records
          </span>
        </div>

        {/* Empty State */}
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-zinc-500">No triage sessions yet.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Submit a triage to see your health timeline here.
            </p>
          </div>
        ) : (
          /* Timeline */
          <div className="relative border-l border-zinc-800/60 pl-8">
            {history.map((entry) => {
              const riskLabel = entry.risk_level ?? "Unknown";
              const symptomsText = Array.isArray(entry.symptoms)
                ? entry.symptoms.join(", ")
                : String(entry.symptoms ?? "");
              const dateText = entry.timestamp
                ? entry.timestamp.toDate().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";

              return (
                <div key={entry.id} className="group relative mb-8 last:mb-0">
                  <span
                    className={`absolute -left-[41px] top-4 h-3 w-3 rounded-full border-2 border-slate-950 ${getRiskDot(riskLabel)}`}
                  />

                  <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700/60 hover:bg-zinc-900/60">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{dateText}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${getRiskBadge(riskLabel)}`}
                      >
                        {riskLabel.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-zinc-200">
                      {symptomsText || "No symptoms recorded"}
                    </p>

                    <p className="mt-2 text-xs text-zinc-500">
                      Dept: {entry.department ?? "N/A"}
                    </p>

                    {entry.summary && (
                      <div className="mt-3 rounded-lg border border-zinc-800/40 bg-zinc-950/40 px-3 py-2.5">
                        <p className="text-[11px] leading-relaxed text-zinc-500">
                          <span className="mr-1 font-semibold text-zinc-400">
                            AI Insight:
                          </span>
                          {entry.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
