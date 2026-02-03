"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar solicitação");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Email Enviado!
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Se existe uma conta com o email <strong className="text-[var(--text-primary)]">{email}</strong>,
            você receberá instruções para redefinir sua senha.
          </p>
        </div>

        <div className="bg-[var(--bg-hover)] rounded-xl p-4 text-sm text-[var(--text-muted)]">
          <p className="mb-2">Não recebeu o email?</p>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-dimmed)]">
            <li>Verifique a pasta de spam</li>
            <li>Confirme se digitou o email correto</li>
            <li>Aguarde alguns minutos</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setIsSubmitted(false);
              setEmail("");
            }}
            className="w-full py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all"
          >
            Tentar outro email
          </button>
          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white text-center hover:opacity-90 transition-all"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Esqueceu a senha?
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Digite seu email e enviaremos instruções para redefinir sua senha
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
            htmlFor="email"
            className="block text-sm font-medium text-[var(--text-muted)] mb-2"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white hover:opacity-90 transition-all shadow-lg shadow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            "Enviar instruções"
          )}
        </button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o login
        </Link>
      </form>
    </div>
  );
}
