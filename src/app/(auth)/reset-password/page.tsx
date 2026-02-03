"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    if (!token) {
      setTokenError("Token não fornecido");
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setIsValid(true);
        } else {
          setTokenError(data.error || "Token inválido");
        }
      } catch {
        setTokenError("Erro ao validar token");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao redefinir senha");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[var(--text-muted)]">Validando link...</p>
      </div>
    );
  }

  if (!isValid && !isSubmitted) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Link Inválido
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            {tokenError || "Este link de recuperação não é válido ou já expirou."}
          </p>
        </div>

        <div className="bg-[var(--bg-hover)] rounded-xl p-4 text-sm text-[var(--text-muted)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--text-primary)] mb-1">Possíveis motivos:</p>
              <ul className="list-disc list-inside space-y-1 text-[var(--text-dimmed)]">
                <li>O link expirou (válido por 1 hora)</li>
                <li>O link já foi utilizado</li>
                <li>O link foi copiado incorretamente</li>
              </ul>
            </div>
          </div>
        </div>

        <Link
          href="/forgot-password"
          className="block w-full py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white text-center hover:opacity-90 transition-all"
        >
          Solicitar novo link
        </Link>

        <Link
          href="/login"
          className="block text-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Senha Alterada!
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Sua senha foi redefinida com sucesso. Agora você pode fazer login com a nova senha.
          </p>
        </div>

        <Link
          href="/login"
          className="block w-full py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white text-center hover:opacity-90 transition-all shadow-lg shadow-primary"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Nova Senha
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Digite sua nova senha abaixo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[var(--text-muted)] mb-2"
          >
            Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] hover:text-[var(--text-muted)]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-[var(--text-muted)] mb-2"
          >
            Confirmar Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] hover:text-[var(--text-muted)]"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {}
        {password && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= level * 3
                      ? password.length >= 12
                        ? "bg-emerald-500"
                        : password.length >= 8
                        ? "bg-amber-500"
                        : "bg-red-500"
                      : "bg-[var(--bg-hover-strong)]"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--text-dimmed)]">
              {password.length < 6
                ? "Senha muito curta"
                : password.length < 8
                ? "Senha fraca"
                : password.length < 12
                ? "Senha média"
                : "Senha forte"}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !password || !confirmPassword}
          className="w-full py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white hover:opacity-90 transition-all shadow-lg shadow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Alterando...
            </span>
          ) : (
            "Alterar senha"
          )}
        </button>
      </form>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-[var(--text-muted)]">Carregando...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
