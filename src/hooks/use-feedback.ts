"use client";

import { useCallback, useRef } from "react";
import { usePreferences } from "@/contexts";

const SOUNDS = {
  success: "/sounds/sucess.mp3",
  error: "/sounds/error.mp3",
  celebrate: "/sounds/celebrate.mp3",
} as const;

export function useFeedback() {
  const { notifications } = usePreferences();
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  const playSound = useCallback(
    (sound: keyof typeof SOUNDS) => {
      if (!notifications.sounds) return;
      try {
        const cached = audioCache.current.get(sound);
        if (cached) {
          cached.currentTime = 0;
          cached.play();
          return;
        }
        const audio = new Audio(SOUNDS[sound]);
        audio.volume = 0.5;
        audioCache.current.set(sound, audio);
        audio.play();
      } catch {
        // Audio may not be available
      }
    },
    [notifications.sounds]
  );

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!notifications.vibration) return;
      const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
      if (isMobile && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    },
    [notifications.vibration]
  );

  const success = useCallback(() => {
    playSound("success");
    vibrate(100);
  }, [playSound, vibrate]);

  const error = useCallback(() => {
    playSound("error");
    vibrate([100, 50, 100]);
  }, [playSound, vibrate]);

  const celebrate = useCallback(() => {
    playSound("celebrate");
    vibrate(300);
  }, [playSound, vibrate]);

  return { success, error, celebrate };
}
