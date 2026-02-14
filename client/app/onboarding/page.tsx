"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function Onboarding() {
  const router = useRouter();
  const displayName = useUserStore((s) => s.displayName);
  const setDemographics = useUserStore((s) => s.setDemographics);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!age || !gender) return;
    setDemographics({ age, gender });
    router.push("/triage");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-10 backdrop-blur-xl"
      >
        <h1 className="text-2xl font-bold text-white">
          Welcome, {displayName || "User"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Tell us a bit about yourself to personalize your experience.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="age" className="text-sm font-medium text-zinc-300">
              Age
            </label>
            <input
              id="age"
              type="number"
              min="1"
              max="120"
              placeholder="Enter your age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              className="rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="gender"
              className="text-sm font-medium text-zinc-300"
            >
              Gender
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className="rounded-lg border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
