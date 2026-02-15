"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import SystemThreadTracker from "@/components/ui/SystemThreadTracker";
import AuthProvider from "@/components/providers/AuthProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/";

    return (
        <AuthProvider>
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

            {/* ═══════ CHAT FEATURE ═══════ */}
            {!isLoginPage && pathname !== "/assistant" && (
                <Link
                    href="/assistant"
                    className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-500 active:scale-95"
                    aria-label="Open Health Assistant"
                >
                    <MessageSquare size={24} />
                </Link>
            )}
        </div>
        </AuthProvider>
    );
}
