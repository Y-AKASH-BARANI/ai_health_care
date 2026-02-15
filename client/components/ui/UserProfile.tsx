"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, LogOut, AlertTriangle } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  setDoc,
} from "firebase/firestore";

interface HistoryEntry {
  id: string;
  symptoms: string[];
  conditions: string[];
  risk_level: string;
  department: string;
  explanation: string;
  fileName: string | null;
  timestamp: Timestamp | null;
}

export default function UserProfile() {
  const {
    displayName,
    email,
    photoURL,
    uid,
    age,
    gender,
    updateDemographics,
    clearUser,
  } = useUserStore();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editAge, setEditAge] = useState(age);
  const [editGender, setEditGender] = useState(gender);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!uid) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, "users", uid, "history"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: HistoryEntry[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HistoryEntry[];
      setHistory(entries);
    }, (error) => {
      console.warn("Profile history listener error:", error.message);
    });

    return () => unsubscribe();
  }, [uid]);

  function handleOpen() {
    setEditAge(age);
    setEditGender(gender);
    setOpen(true);
  }

  function handleSave() {
    updateDemographics(editAge, editGender);
    if (uid) {
      setDoc(
        doc(db, "users", uid),
        { age: editAge, gender: editGender },
        { merge: true }
      ).catch((err) => console.error("Failed to save demographics:", err));
    }
  }

  async function handleLogout() {
    await auth.signOut();
    clearUser();
    setOpen(false);
    router.push("/");
  }

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <>
      {/* Avatar Trigger */}
      <button
        onClick={handleOpen}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 transition-colors hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-xs font-medium text-zinc-300">{initials}</span>
        )}
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed right-4 top-16 z-50 flex max-h-[calc(100vh-5rem)] w-full max-w-sm flex-col rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl"
            >
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm font-medium text-zinc-300">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {displayName || "User"}
                    </p>
                    <p className="text-xs text-zinc-400">{email}</p>
                  </div>
                </div>

                {/* Section 1: Demographics */}
                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Demographics
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-400">Age</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={editAge}
                        onChange={(e) => setEditAge(e.target.value)}
                        className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-400">Gender</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">
                          Prefer not to say
                        </option>
                      </select>
                    </div>
                    <button
                      onClick={handleSave}
                      className="mt-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Section 2: Triage History */}
                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Triage History
                  </h3>
                  {history.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No triage results yet
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {history.map((entry) => (
                        <li
                          key={entry.id}
                          className="rounded-lg border border-zinc-800 bg-black/50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
                            <span className="text-xs font-medium text-white">
                              {entry.risk_level} Risk
                            </span>
                            <span className="ml-auto text-[10px] text-zinc-500">
                              {entry.timestamp
                                ? entry.timestamp.toDate().toLocaleDateString("en-US")
                                : ""}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-zinc-400">
                            {entry.department}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
