"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const isTransitioning = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("fincontrol-theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Add transition class before changing theme
    if (!isTransitioning.current) {
      root.classList.add("theme-transitioning");
    }

    root.classList.remove("light", "dark");
    root.classList.add(theme);

    localStorage.setItem("fincontrol-theme", theme);

    // Remove transition class after animation completes
    const timeout = setTimeout(() => {
      root.classList.remove("theme-transitioning");
      isTransitioning.current = false;
    }, 450);

    return () => clearTimeout(timeout);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    isTransitioning.current = true;
    const root = document.documentElement;
    root.classList.add("theme-transitioning");

    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
