"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocFromCache } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useUserStore } from "@/store/userStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const setUser = useUserStore((s) => s.setUser);
  const setDemographics = useUserStore((s) => s.setDemographics);
  const setSessionCount = useUserStore((s) => s.setSessionCount);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          displayName: firebaseUser.displayName ?? "",
          email: firebaseUser.email ?? "",
          photoURL: firebaseUser.photoURL ?? "",
          uid: firebaseUser.uid,
        });

        // Restore demographics from Firestore if they exist
        try {
          const ref = doc(db, "users", firebaseUser.uid);
          let userDoc;
          try {
            userDoc = await getDoc(ref);
          } catch {
            // Server unreachable, try local cache
            userDoc = await getDocFromCache(ref).catch(() => null);
          }
          if (userDoc?.exists()) {
            const data = userDoc.data();
            if (data.age || data.gender) {
              setDemographics({
                age: data.age ?? "",
                gender: data.gender ?? "",
              });
            }
            if (typeof data.sessionCount === "number") {
              setSessionCount(data.sessionCount);
            }
          }
        } catch {
          // Demographics will load on next successful connection
        }
      } else {
        clearUser();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setDemographics, setSessionCount, clearUser]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
