"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { getPasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from "@/lib/password-utils";

export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);
  const strengthColor = getPasswordStrengthColor(passwordStrength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "A nova senha deve ter no mínimo 6 caracteres",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao alterar senha");
      }

      setMessage({ type: "success", text: "Senha alterada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro ao alterar senha",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
      <div className="p-6 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Alterar Senha
            </h3>
            <p className="text-sm text-[var(--text-dimmed)]">
              Mantenha sua conta segura
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span
              className={
                message.type === "success"
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            >
              {message.text}
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            Senha Atual
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              required
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] hover:text-[var(--text-muted)]"
            >
              {showCurrentPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] hover:text-[var(--text-muted)]"
            >
              {showNewPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {newPassword && (
            <div className="mt-3">
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-colors"
                    style={{
                      backgroundColor: i < passwordStrength ? strengthColor : "var(--border-color)",
                    }}
                  />
                ))}
              </div>
              <p
                className="text-xs"
                style={{ color: passwordStrength > 0 ? strengthColor : "var(--text-muted)" }}
              >
                {strengthLabel}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dimmed)]" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)] hover:text-[var(--text-muted)]"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {confirmPassword && (
            <p
              className="text-xs mt-2"
              style={{ color: newPassword === confirmPassword ? "#22c55e" : "#ef4444" }}
            >
              {newPassword === confirmPassword ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Alterando...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Alterar Senha
            </>
          )}
        </button>
      </form>
    </div>
  );
}
