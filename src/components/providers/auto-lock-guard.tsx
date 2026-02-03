"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePreferences } from "@/contexts";

export function AutoLockGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { privacy } = usePreferences();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLock = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (privacy.autoLock && privacy.autoLockTime > 0 && session) {
      timerRef.current = setTimeout(handleLock, privacy.autoLockTime * 60 * 1000);
    }
  }, [privacy.autoLock, privacy.autoLockTime, session, handleLock]);

  useEffect(() => {
    if (!privacy.autoLock || !session) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [privacy.autoLock, privacy.autoLockTime, session, resetTimer]);

  return <>{children}</>;
}
