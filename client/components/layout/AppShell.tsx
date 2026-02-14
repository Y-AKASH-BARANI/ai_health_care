"use client";

import { usePathname } from "next/navigation";
import SystemThreadTracker from "@/components/ui/SystemThreadTracker";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/";

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 to-black text-white">
            {/* ═══════ HEADER ═══════ */}
            <header className={`flex items-center justify-between border-b border-zinc-800/60 px-6 py-4 lg:px-10 ${isLoginPage ? "invisible" : ""}`}>
                <span className="text-xl font-bold tracking-wide text-zinc-100">
                    Arogya Care
                </span>
                <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-zinc-500">Patient Session Active</span>
                </div>
            </header>

            {/* ═══════ THREAD TRACKER ═══════ */}
            <div className="border-b border-zinc-800/40 px-6 lg:px-10">
                <SystemThreadTracker />
            </div>

            {/* ═══════ CONTENT ═══════ */}
            <div className="flex-1">{children}</div>
        </div>
    );
}
