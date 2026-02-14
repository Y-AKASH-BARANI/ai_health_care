"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Chrome, ShieldCheck, Activity } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { useUserStore } from "@/store/userStore";
import { useState, useEffect } from "react";

const ROTATING_KEYWORDS = [
  "Risk Prediction",
  "Smart Routing",
  "Explainable AI",
  "Priority Optimization",
];

export default function Home() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [keywordIndex, setKeywordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKeywordIndex((prev) => (prev + 1) % ROTATING_KEYWORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      const user = await signInWithGoogle();
      setUser({
        displayName: user.displayName ?? "",
        email: user.email ?? "",
        photoURL: user.photoURL ?? "",
        uid: user.uid,
      });
      router.push("/onboarding");
    } catch (error) {
      console.error("Sign-in failed:", error);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* ── Background Orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      {/* ── Grid Pattern Overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Main Content ── */}
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        {/* ════════════════════════════════════════════
            LEFT PANEL — Intelligence Narrative
        ════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center lg:items-start lg:px-20 lg:text-left"
        >
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8 flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium tracking-wide text-emerald-400">
              SYSTEM ONLINE
            </span>
          </motion.div>

          {/* Main Headline */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Intelligent Triage
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
              Infrastructure
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-4 text-lg font-medium text-zinc-400 sm:text-xl">
            Real-Time Clinical Decision Support
          </p>

          {/* Rotating Keywords */}
          <div className="mt-8 flex items-center gap-3">
            <Activity className="h-4 w-4 text-emerald-500" />
            <div className="h-7 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={keywordIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-lg font-semibold text-transparent"
                >
                  {ROTATING_KEYWORDS[keywordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Tagline */}
          <p className="mt-10 max-w-md text-sm leading-relaxed text-zinc-500">
            AI-powered triage for faster, smarter care delivery.
          </p>

          {/* Decorative Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-12 flex gap-8"
          >

          </motion.div>
        </motion.div>

        {/* ════════════════════════════════════════════
            RIGHT PANEL — Access Card
        ════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex flex-1 items-center justify-center px-8 py-16 lg:px-20"
        >
          <div className="w-full max-w-md">
            {/* Glass Card */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 shadow-2xl shadow-black/40 backdrop-blur-xl">
              {/* Inner glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent" />

              <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Shield Icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                  <ShieldCheck className="h-7 w-7 text-emerald-400" />
                </div>

                {/* Header */}
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-white">
                    Access Arogya Care
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Secure AI-assisted patient prioritization.
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

                {/* Google Sign-In Button */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Chrome className="h-5 w-5 text-zinc-300 transition-colors group-hover:text-emerald-400" />
                  {loading ? "Signing in..." : "Continue with Google"}
                </button>

                {/* Footer */}
                <p className="text-center text-[11px] leading-relaxed text-zinc-600">
                  By continuing, you agree to our{" "}
                  <span className="text-zinc-500 underline underline-offset-2">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-zinc-500 underline underline-offset-2">
                    Privacy Policy
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Card bottom accent */}
            <div className="mx-auto mt-1 h-px w-3/4 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
