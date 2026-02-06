"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Palette,
  Type,
  RotateCcw,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import {
  useAppearance,
  useTheme,
  colorPalettes,
  fontWeights,
  fontSizes,
  type ColorPalette,
  type FontWeight,
  type FontSize,
} from "@/contexts";

export default function AparenciaPage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { settings, updateSettings, resetSettings } = useAppearance();
  const { theme, toggleTheme } = useTheme();

  const paletteEntries = Object.entries(colorPalettes) as [ColorPalette, typeof colorPalettes[ColorPalette]][];
  const weightEntries = Object.entries(fontWeights) as [FontWeight, typeof fontWeights[FontWeight]][];
  const sizeEntries = Object.entries(fontSizes) as [FontSize, typeof fontSizes[FontSize]][];

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-colors duration-500"
          style={{ backgroundColor: `${colorPalettes[settings.colorPalette].primary}33` }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl transition-colors duration-500"
          style={{ backgroundColor: `${colorPalettes[settings.colorPalette].secondary}1A` }}
        />
      </div>

      {}
      <div className="relative max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {}
        <button
          onClick={() => router.push("/conta")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tc("back")}</span>
        </button>

        {}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {t("appearance")}
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              {t("appearanceDesc")}
            </p>
          </div>
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-all"
            title={t("restore")}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t("restore")}</span>
          </button>
        </div>

        <div className="space-y-6">
          {}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-xl transition-colors duration-300"
                style={{ backgroundColor: `${colorPalettes[settings.colorPalette].primary}1A` }}
              >
                {theme === "dark" ? (
                  <Moon className="w-5 h-5" style={{ color: colorPalettes[settings.colorPalette].primary }} />
                ) : (
                  <Sun className="w-5 h-5" style={{ color: colorPalettes[settings.colorPalette].primary }} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("theme")}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{t("themeDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => theme === "dark" && toggleTheme()}
                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                  theme === "light"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                    : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                }`}
                style={theme === "light" ? { borderColor: colorPalettes[settings.colorPalette].primary } : undefined}
              >
                <Sun className="w-5 h-5" />
                <span className="font-medium">{t("light")}</span>
                {theme === "light" && (
                  <Check className="w-4 h-4" style={{ color: colorPalettes[settings.colorPalette].primary }} />
                )}
              </button>
              <button
                onClick={() => theme === "light" && toggleTheme()}
                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                  theme === "dark"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                    : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                }`}
                style={theme === "dark" ? { borderColor: colorPalettes[settings.colorPalette].primary } : undefined}
              >
                <Moon className="w-5 h-5" />
                <span className="font-medium">{t("dark")}</span>
                {theme === "dark" && (
                  <Check className="w-4 h-4" style={{ color: colorPalettes[settings.colorPalette].primary }} />
                )}
              </button>
            </div>
          </div>

          {}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-xl transition-colors duration-300"
                style={{ backgroundColor: `${colorPalettes[settings.colorPalette].primary}1A` }}
              >
                <Palette className="w-5 h-5" style={{ color: colorPalettes[settings.colorPalette].primary }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("colorPalette")}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{t("colorPaletteDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {paletteEntries.map(([key, palette]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ colorPalette: key })}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    settings.colorPalette === key
                      ? "border-[var(--border-color-strong)]"
                      : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                  }`}
                  style={
                    settings.colorPalette === key
                      ? { borderColor: palette.primary, backgroundColor: `${palette.primary}10` }
                      : undefined
                  }
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
                    }}
                  />
                  <span className="text-xs text-[var(--text-muted)]">{palette.name}</span>
                  {settings.colorPalette === key && (
                    <div
                      className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: palette.primary }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-xl transition-colors duration-300"
                style={{ backgroundColor: `${colorPalettes[settings.colorPalette].primary}1A` }}
              >
                <Type className="w-5 h-5" style={{ color: colorPalettes[settings.colorPalette].primary }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("typography")}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{t("typographyDesc")}</p>
              </div>
            </div>

            {}
            <div className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-3">{t("fontWeight")}</p>
              <div className="grid grid-cols-5 gap-2">
                {weightEntries.map(([key, weight]) => (
                  <button
                    key={key}
                    onClick={() => updateSettings({ fontWeight: key })}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      settings.fontWeight === key
                        ? "border-[var(--border-color-strong)]"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                    style={
                      settings.fontWeight === key
                        ? {
                            borderColor: colorPalettes[settings.colorPalette].primary,
                            backgroundColor: `${colorPalettes[settings.colorPalette].primary}10`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="text-sm text-[var(--text-primary)]"
                      style={{ fontWeight: weight.value }}
                    >
                      Aa
                    </span>
                    <p className="text-[10px] text-[var(--text-dimmed)] mt-1">{weight.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tamanho */}
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-3">{t("fontSize")}</p>
              <div className="grid grid-cols-3 gap-3">
                {sizeEntries.map(([key, size]) => {
                  const sizeLabels: Record<string, string> = {
                    small: t("fontSizeSmall"),
                    normal: t("fontSizeNormal"),
                    large: t("fontSizeLarge"),
                  };
                  return (
                    <button
                      key={key}
                      onClick={() => updateSettings({ fontSize: key })}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        settings.fontSize === key
                          ? "border-[var(--border-color-strong)]"
                          : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                      }`}
                      style={
                        settings.fontSize === key
                          ? {
                              borderColor: colorPalettes[settings.colorPalette].primary,
                              backgroundColor: `${colorPalettes[settings.colorPalette].primary}10`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="text-[var(--text-primary)] font-medium"
                        style={{ fontSize: `${14 * size.multiplier}px` }}
                      >
                        {t("textSample")}
                      </span>
                      <p className="text-[10px] text-[var(--text-dimmed)] mt-1">{sizeLabels[key]}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-4">{t("preview")}</h3>
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${colorPalettes[settings.colorPalette].primary}10` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${colorPalettes[settings.colorPalette].primary}, ${colorPalettes[settings.colorPalette].secondary})`,
                  }}
                >
                  F
                </div>
                <div>
                  <p
                    className="text-[var(--text-primary)]"
                    style={{
                      fontWeight: fontWeights[settings.fontWeight].value,
                      fontSize: `${16 * fontSizes[settings.fontSize].multiplier}px`,
                    }}
                  >
                    FinControl
                  </p>
                  <p
                    className="text-[var(--text-dimmed)]"
                    style={{
                      fontSize: `${12 * fontSizes[settings.fontSize].multiplier}px`,
                    }}
                  >
                    {t("previewSubtitle")}
                  </p>
                </div>
              </div>
              <button
                className="w-full py-3 rounded-xl text-white font-medium transition-all"
                style={{
                  background: `linear-gradient(135deg, ${colorPalettes[settings.colorPalette].primary}, ${colorPalettes[settings.colorPalette].secondary})`,
                  fontWeight: fontWeights[settings.fontWeight].value,
                  fontSize: `${14 * fontSizes[settings.fontSize].multiplier}px`,
                }}
              >
                {t("exampleButton")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
