"use client";

import { Activity } from "lucide-react";
import UserProfile from "@/components/ui/UserProfile";

export default function TriageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-bold text-white">Triage.AI</span>
          </div>
          <UserProfile />
        </div>
      </header>
      {children}
    </div>
  );
}
