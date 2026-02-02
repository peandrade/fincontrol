"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ColorPalette = "purple" | "blue" | "emerald" | "amber" | "pink" | "red" | "cyan" | "indigo";
export type FontWeight = "light" | "regular" | "medium" | "semibold" | "bold";
export type FontSize = "small" | "normal" | "large";

interface AppearanceSettings {
  colorPalette: ColorPalette;
  fontWeight: FontWeight;
  fontSize: FontSize;
}

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateSettings: (settings: Partial<AppearanceSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppearanceSettings = {
  colorPalette: "purple",
  fontWeight: "regular",
  fontSize: "normal",
};

const colorPalettes: Record<ColorPalette, { primary: string; secondary: string; name: string }> = {
  purple: { primary: "#9333EA", secondary: "#7C3AED", name: "Roxo" },
  blue: { primary: "#3B82F6", secondary: "#2563EB", name: "Azul" },
  emerald: { primary: "#10B981", secondary: "#059669", name: "Verde" },
  amber: { primary: "#F59E0B", secondary: "#D97706", name: "Laranja" },
  pink: { primary: "#EC4899", secondary: "#DB2777", name: "Rosa" },
  red: { primary: "#EF4444", secondary: "#DC2626", name: "Vermelho" },
  cyan: { primary: "#06B6D4", secondary: "#0891B2", name: "Ciano" },
  indigo: { primary: "#6366F1", secondary: "#4F46E5", name: "Índigo" },
};

const fontWeights: Record<FontWeight, { value: number; name: string }> = {
  light: { value: 300, name: "Light" },
  regular: { value: 400, name: "Regular" },
  medium: { value: 500, name: "Medium" },
  semibold: { value: 600, name: "Semibold" },
  bold: { value: 700, name: "Bold" },
};

const fontSizes: Record<FontSize, { multiplier: number; name: string }> = {
  small: { multiplier: 0.9, name: "Pequeno" },
  normal: { multiplier: 1, name: "Normal" },
  large: { multiplier: 1.1, name: "Grande" },
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("appearance-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        setSettings(defaultSettings);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem("appearance-settings", JSON.stringify(settings));

    // Apply color palette
    const palette = colorPalettes[settings.colorPalette];
    document.documentElement.style.setProperty("--color-primary", palette.primary);
    document.documentElement.style.setProperty("--color-secondary", palette.secondary);

    // Apply font weight
    const weight = fontWeights[settings.fontWeight];
    document.documentElement.style.setProperty("--font-weight-base", weight.value.toString());

    // Apply font size
    const size = fontSizes[settings.fontSize];
    document.documentElement.style.setProperty("--font-size-multiplier", size.multiplier.toString());

  }, [settings, mounted]);

  const updateSettings = (newSettings: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
}

export { colorPalettes, fontWeights, fontSizes };
