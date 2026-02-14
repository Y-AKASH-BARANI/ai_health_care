"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Chrome } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { useUserStore } from "@/store/userStore";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex w-full max-w-md flex-col items-center gap-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-10"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Smart Triage
          </h1>
          <p className="text-center text-sm text-zinc-400">
            AI-powered patient triage. Sign in to get started.
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
        >
          <Chrome className="h-5 w-5" />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-center text-xs text-zinc-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
