"use client";

import { Activity } from "lucide-react";
import type { VitalCheck } from "@/store/userStore";

interface VitalVizProps {
  vitals: VitalCheck[];
}

const STATUS_COLORS: Record<string, { bar: string; text: string }> = {
  normal: { bar: "bg-emerald-500", text: "text-emerald-400" },
  warning: { bar: "bg-amber-500", text: "text-amber-400" },
  critical: { bar: "bg-red-500", text: "text-red-400" },
};

const STATUS_LABEL: Record<string, string> = {
  normal: "Normal",
  warning: "Warning",
  critical: "Critical",
};

export default function VitalViz({ vitals }: VitalVizProps) {
  if (!vitals || vitals.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Vital Signs Analysis
        </h3>
      </div>
      <div className="space-y-5">
        {vitals.map((vital, i) => {
          const colors = STATUS_COLORS[vital.status] ?? STATUS_COLORS.normal;
          const score = Math.max(0, Math.min(100, vital.score));

          return (
            <div key={i}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  {vital.name}
                </span>
                <span className={`text-xs font-medium ${colors.text}`}>
                  {STATUS_LABEL[vital.status] ?? vital.status}
                </span>
              </div>
              <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">{vital.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
