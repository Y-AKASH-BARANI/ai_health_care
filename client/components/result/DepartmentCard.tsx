"use client";

import { Building2, Clock, ShieldAlert, UserRound } from "lucide-react";
import type { DepartmentInsight } from "@/store/userStore";

interface DepartmentCardProps {
  insights: DepartmentInsight;
}

export default function DepartmentCard({ insights }: DepartmentCardProps) {
  if (!insights || !insights.department_name) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Department Insights
        </h3>
      </div>

      <p className="mb-4 text-lg font-bold text-white">
        {insights.department_name}
      </p>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <div>
            <p className="text-xs font-medium text-zinc-500">Specialist</p>
            <p className="text-sm text-zinc-300">{insights.specialist_type}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
          <div>
            <p className="text-xs font-medium text-zinc-500">Est. Wait Time</p>
            <p className="text-sm text-zinc-300">
              {insights.wait_time_estimate}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p className="text-xs font-medium text-zinc-500">
              Immediate Action
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {insights.immediate_action}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
