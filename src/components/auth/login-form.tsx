"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { LogIn, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("loginError"));
      } else {
        const hasExplicitCallback = searchParams.has("callbackUrl");
        if (hasExplicitCallback) {
          router.push(callbackUrl);
        } else {
          try {
            const prefsRes = await fetch("/api/user/preferences");
            if (prefsRes.ok) {
              const prefs = await prefsRes.json();
              const pageMap: Record<string, string> = {
                dashboard: "/",
                cards: "/cartoes",
                investments: "/investimentos",
              };
              const target = pageMap[prefs.general?.defaultPage] || "/";
              router.push(target);
            } else {
              router.push("/");
            }
          } catch {
            router.push("/");
          }
        }
        router.refresh();
      }
    } catch {
      setError(t("loginGenericError"));
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
          {t("loginTitle")}
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
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {t("password")}
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary-color hover:opacity-80 transition-colors"
            >
              {t("forgotPassword")}
            </Link>
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
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-primary-gradient text-white font-medium shadow-lg shadow-primary hover:shadow-[var(--color-primary)]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("loggingIn")}
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              {t("login")}
            </>
          )}
        </button>
      </form>

      {}
      <p
        className="mt-6 text-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="text-primary-color hover:opacity-80 font-medium"
        >
          {t("register")}
        </Link>
      </p>
    </div>
  );
}
