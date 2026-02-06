"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Calendar,
  List,
  CreditCard,
  AlertTriangle,
  Check,
  Coins,
  Globe,
} from "lucide-react";
import { usePreferences } from "@/contexts";
import type { DisplayCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { localeNames, localeFlags, type Locale } from "@/i18n/config";

const pages = [
  { id: "dashboard", nameKey: "pageDashboard", icon: Home },
  { id: "cards", nameKey: "pageCards", icon: CreditCard },
  { id: "investments", nameKey: "pageInvestments", icon: Calendar },
];

const periods = [
  { id: "week", nameKey: "periodWeek" },
  { id: "month", nameKey: "periodMonth" },
  { id: "quarter", nameKey: "periodQuarter" },
  { id: "year", nameKey: "periodYear" },
];

const sortOptions = [
  { id: "recent", nameKey: "sortRecent" },
  { id: "oldest", nameKey: "sortOldest" },
  { id: "highest", nameKey: "sortHighest" },
  { id: "lowest", nameKey: "sortLowest" },
];

const currencies: { id: DisplayCurrency; nameKey: string; symbol: string; flag: string }[] = [
  { id: "BRL", nameKey: "currencyBRL", symbol: "R$", flag: "🇧🇷" },
  { id: "USD", nameKey: "currencyUSD", symbol: "$", flag: "🇺🇸" },
  { id: "EUR", nameKey: "currencyEUR", symbol: "€", flag: "🇪🇺" },
  { id: "GBP", nameKey: "currencyGBP", symbol: "£", flag: "🇬🇧" },
];

const languages: { id: Locale; name: string; flag: string }[] = [
  { id: "pt", name: localeNames.pt, flag: localeFlags.pt },
  { id: "en", name: localeNames.en, flag: localeFlags.en },
  { id: "es", name: localeNames.es, flag: localeFlags.es },
];

export default function GeralPage() {
  const router = useRouter();
  const { general, updateGeneral, isLoading, isSaving } = usePreferences();
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <button
          onClick={() => router.push("/conta")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{tc("back")}</span>
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {t("general")}
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              {t("generalDesc")}
            </p>
          </div>
          {isSaving && (
            <span className="text-sm text-[var(--text-muted)] animate-pulse">{tc("saving")}</span>
          )}
        </div>

        <div className="space-y-6">
          {/* Página Inicial */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Home className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("defaultPage")}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{t("defaultPageDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {pages.map((page) => {
                const Icon = page.icon;
                const isSelected = general.defaultPage === page.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => updateGeneral({ defaultPage: page.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto ${isSelected ? "text-blue-400" : "text-[var(--text-muted)]"}`} />
                    <p className="text-sm text-[var(--text-primary)] mt-2">{t(page.nameKey)}</p>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-400 mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Período Padrão */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("defaultPeriod")}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{t("defaultPeriodDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {periods.map((period) => {
                const isSelected = general.defaultPeriod === period.id;
                return (
                  <button
                    key={period.id}
                    onClick={() => updateGeneral({ defaultPeriod: period.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <p className="text-sm text-[var(--text-primary)]">{t(period.nameKey)}</p>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ordenação Padrão */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <List className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("defaultSort")}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{t("defaultSortDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {sortOptions.map((option) => {
                const isSelected = general.defaultSort === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => updateGeneral({ defaultSort: option.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <p className="text-sm text-[var(--text-primary)]">{t(option.nameKey)}</p>
                    {isSelected && (
                      <Check className="w-4 h-4 text-violet-400 mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Moeda de Exibição */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10">
                <Coins className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("displayCurrency")}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{t("displayCurrencyDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currencies.map((currency) => {
                const isSelected = (general.displayCurrency || "BRL") === currency.id;
                return (
                  <button
                    key={currency.id}
                    onClick={() => updateGeneral({ displayCurrency: currency.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <span className="text-xl">{currency.flag}</span>
                    <p className="text-sm text-[var(--text-primary)] mt-1 font-medium">
                      {currency.symbol} — {t(currency.nameKey)}
                    </p>
                    {isSelected && (
                      <Check className="w-4 h-4 text-cyan-400 mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {(general.displayCurrency || "BRL") !== "BRL" && (
              <p className="text-xs text-[var(--text-dimmed)] mt-3 text-center">
                {t("displayCurrencyNote")}
              </p>
            )}
          </div>

          {/* Idioma */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("language")}</h2>
                <p className="text-sm text-[var(--text-dimmed)]">{t("languageDesc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {languages.map((lang) => {
                const isSelected = (general.language || "pt") === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => updateGeneral({ language: lang.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <p className="text-sm text-[var(--text-primary)] mt-1 font-medium">
                      {lang.name}
                    </p>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-400 mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirmação antes de excluir */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("confirmDelete")}</h2>
                  <p className="text-sm text-[var(--text-dimmed)]">{t("confirmDeleteDesc")}</p>
                </div>
              </div>
              <button
                onClick={() => updateGeneral({ confirmBeforeDelete: !general.confirmBeforeDelete })}
                className={`
                  relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
                  flex items-center px-0.5
                  ${general.confirmBeforeDelete ? "bg-amber-500" : "bg-[var(--bg-hover)]"}
                `}
                role="switch"
                aria-checked={general.confirmBeforeDelete}
              >
                <span
                  className={`
                    w-6 h-6 rounded-full bg-white shadow-md
                    transition-transform duration-200 ease-in-out
                    ${general.confirmBeforeDelete ? "translate-x-[26px]" : "translate-x-0"}
                  `}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
