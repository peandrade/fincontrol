"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";

interface LanguageSelectorProps {
  currentLocale?: Locale;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function LanguageSelector({
  currentLocale,
  showLabel = false,
  size = "md"
}: LanguageSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Locale>(currentLocale || "pt");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current locale from cookie on mount
  useEffect(() => {
    if (!currentLocale) {
      const cookieLocale = document.cookie
        .split("; ")
        .find((row) => row.startsWith("locale="))
        ?.split("=")[1] as Locale | undefined;
      if (cookieLocale && locales.includes(cookieLocale)) {
        setSelected(cookieLocale);
      }
    }
  }, [currentLocale]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (locale: Locale) => {
    setSelected(locale);
    setIsOpen(false);

    // Set cookie and refresh page
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    router.refresh();
  };

  const sizeClasses = size === "sm"
    ? "px-2.5 py-1.5 text-sm gap-1.5"
    : "px-3 py-2 text-sm gap-2";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center rounded-lg border transition-colors hover:border-[var(--color-primary)]/50 ${sizeClasses}`}
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <Globe className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} style={{ color: "var(--text-muted)" }} />
        <span>{localeFlags[selected]}</span>
        {showLabel && <span>{localeNames[selected]}</span>}
        <svg
          className={`transition-transform ${isOpen ? "rotate-180" : ""} ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--text-muted)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 py-1 rounded-lg border shadow-lg z-50 min-w-[140px]"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => handleSelect(locale)}
              className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-primary)] transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              <span>{localeFlags[locale]}</span>
              <span className="flex-1 text-left">{localeNames[locale]}</span>
              {selected === locale && (
                <Check className="w-4 h-4 text-[var(--color-primary)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
