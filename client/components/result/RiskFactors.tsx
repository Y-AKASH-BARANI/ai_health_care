"use client";

import { AlertCircle } from "lucide-react";

interface RiskFactorsProps {
  factors: string[];
}

export default function RiskFactors({ factors }: RiskFactorsProps) {
  if (!factors || factors.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Risk Factors
      </h3>
      <ul className="space-y-3">
        {factors.map((factor, i) => (
          <li key={i} className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span className="text-sm leading-relaxed text-zinc-300">
              {factor}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
