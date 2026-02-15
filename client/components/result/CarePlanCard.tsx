"use client";

import { CheckCircle2, UtensilsCrossed, Ban } from "lucide-react";
import type { CarePlan } from "@/store/userStore";

interface CarePlanCardProps {
  plan: CarePlan;
}

export default function CarePlanCard({ plan }: CarePlanCardProps) {
  const hasInstructions = plan?.care_instructions?.length > 0;
  const hasRecommendations = plan?.dietary_recommendations?.length > 0;
  const hasRestrictions = plan?.dietary_restrictions?.length > 0;

  if (!hasInstructions && !hasRecommendations && !hasRestrictions) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Personalized Care Plan
      </h3>

      {/* ── Immediate Care Instructions ── */}
      {hasInstructions && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Immediate Care
          </p>
          <ul className="space-y-2.5">
            {plan.care_instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-sm leading-relaxed text-zinc-300">
                  {instruction}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Diet Protocol Grid ── */}
      {(hasRecommendations || hasRestrictions) && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Diet Protocol
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Eat / Drink column */}
            {hasRecommendations && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Eat / Drink
                  </span>
                </div>
                <ul className="space-y-2">
                  {plan.dietary_recommendations.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-zinc-300"
                    >
                      <span className="mt-1.5 text-emerald-400">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avoid column */}
            {hasRestrictions && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Avoid
                  </span>
                </div>
                <ul className="space-y-2">
                  {plan.dietary_restrictions.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-zinc-300"
                    >
                      <span className="mt-1.5 text-red-400">&minus;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
