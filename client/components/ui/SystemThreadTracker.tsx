"use client";

import { usePathname } from "next/navigation";

const STEPS = ["Login", "Onboarding", "Dashboard", "Triage", "Result"];

const ROUTE_TO_STEP: Record<string, string> = {
    "/": "Login",
    "/onboarding": "Onboarding",
    "/dashboard": "Dashboard",
    "/triage": "Triage",
    "/result": "Result",
};

export default function SystemThreadTracker() {
    const pathname = usePathname();
    const currentStep = ROUTE_TO_STEP[pathname] ?? "Login";
    const currentIndex = STEPS.indexOf(currentStep);

    return (
        <div className="overflow-x-auto">
            <div className="flex items-center gap-1 py-3">
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isActive = idx === currentIndex;

                    return (
                        <div key={step} className="flex items-center">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${isCompleted
                                        ? "bg-emerald-500"
                                        : isActive
                                            ? "bg-white"
                                            : "bg-zinc-700"
                                        }`}
                                />
                                <span
                                    className={`whitespace-nowrap text-base ${isCompleted
                                        ? "text-zinc-500"
                                        : isActive
                                            ? "font-semibold text-white"
                                            : "text-zinc-600"
                                        }`}
                                >
                                    {step}
                                </span>
                            </div>

                            {idx < STEPS.length - 1 && (
                                <div
                                    className={`mx-2 h-px w-6 shrink-0 ${idx < currentIndex ? "bg-emerald-500/40" : "bg-zinc-800"
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
