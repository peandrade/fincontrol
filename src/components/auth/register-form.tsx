"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff, Coins, Info, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/config";

const currencies = [
  { code: "BRL", symbol: "R$", flag: "🇧🇷" },
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
] as const;

type Currency = (typeof currencies)[number]["code"];

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tCurrencies = useTranslations("currencies");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Locale>("pt");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  // Sync language state with cookie (updated by LanguageSelector)
  useEffect(() => {
    const getLocaleFromCookie = () => {
      const cookieLocale = document.cookie
        .split("; ")
        .find((row) => row.startsWith("locale="))
        ?.split("=")[1] as Locale | undefined;
      if (cookieLocale && locales.includes(cookieLocale)) {
        setLanguage(cookieLocale);
      }
    };
    getLocaleFromCookie();
  }, []);

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = [
    t("passwordStrength.veryWeak"),
    t("passwordStrength.weak"),
    t("passwordStrength.medium"),
    t("passwordStrength.strong"),
    t("passwordStrength.veryStrong"),
  ];
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordMinLength"));
      return;
    }

    setIsLoading(true);

    try {

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, language, currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("registerError"));
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("registerLoginError"));
      } else {
        // Set locale cookie for i18n to work immediately
        document.cookie = `locale=${language}; path=/; max-age=31536000`;
        router.push("/");
        router.refresh();
      }
    } catch {
      setError(t("registerGenericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md p-8 rounded-2xl shadow-2xl"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
        borderWidth: "1px",
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary mb-4">
          <span className="text-3xl">💰</span>
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          FinControl
        </h1>
        <p style={{ color: "var(--text-muted)" }} className="mt-2">
          {t("registerTitle")}
        </p>
      </div>

      {}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-500 text-sm">{error}</span>
        </div>
      )}

      {}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {t("nameOptional")}
          </label>
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full pl-12 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* Currency Select */}
        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {t("currency")}
          </label>
          <div className="relative">
            <Coins
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10"
              style={{ color: "var(--text-muted)" }}
            />
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full pl-12 pr-10 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 cursor-pointer bg-none"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
                backgroundImage: "none",
              }}
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.symbol} {tCurrencies(curr.code)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {t("email")}
          </label>
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {t("password")}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPasswordInfo(!showPasswordInfo)}
                onBlur={() => setTimeout(() => setShowPasswordInfo(false), 150)}
                className="w-4 h-4 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--text-muted)" }}
                aria-label={t("passwordRequirements")}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showPasswordInfo && (
                <div
                  className="absolute left-0 top-6 z-50 w-64 p-3 rounded-lg shadow-lg border text-xs"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                >
                  <p className="font-medium mb-2">{t("passwordRequirements")}</p>
                  <ul className="space-y-1" style={{ color: "var(--text-muted)" }}>
                    <li>• {t("passwordReqMinLength")}</li>
                    <li>• {t("passwordReqUppercase")}</li>
                    <li>• {t("passwordReqLowercase")}</li>
                    <li>• {t("passwordReqNumber")}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-12 pr-12 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {}
          {password && (
            <div className="mt-3">
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-colors"
                    style={{
                      backgroundColor: i < passwordStrength ? strengthColors[passwordStrength - 1] : "var(--border-color)",
                    }}
                  />
                ))}
              </div>
              <p
                className="text-xs"
                style={{ color: passwordStrength > 0 ? strengthColors[passwordStrength - 1] : "var(--text-muted)" }}
              >
                {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : t("enterPassword")}
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {t("confirmPassword")}
          </label>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-12 pr-12 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {}
          {confirmPassword && (
            <p
              className="text-xs mt-2"
              style={{ color: password === confirmPassword ? "#22c55e" : "#ef4444" }}
            >
              {password === confirmPassword ? `✓ ${t("passwordsMatch")}` : `✗ ${t("passwordsDontMatchShort")}`}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-primary-gradient text-white font-medium shadow-lg shadow-primary hover:shadow-[var(--color-primary)]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("registering")}
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              {t("register")}
            </>
          )}
        </button>
      </form>

      {}
      <p
        className="mt-6 text-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-primary-color hover:opacity-80 font-medium"
        >
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
