"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Timer,
  Key,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { usePreferences } from "@/contexts";

export default function PrivacidadePage() {
  const router = useRouter();
  const { privacy, updatePrivacy, isLoading, isSaving } = usePreferences();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password strength
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Digite a senha atual");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Erro ao alterar senha");
        return;
      }

      setPasswordSuccess("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess("");
      }, 2000);
    } catch {
      setPasswordError("Erro ao alterar senha. Tente novamente.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setShowChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
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
          style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/conta")}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Privacidade
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              Controle sua privacidade e segurança
            </p>
          </div>
          {isSaving && (
            <span className="text-sm text-[var(--text-muted)] animate-pulse">Salvando...</span>
          )}
        </div>

        <div className="space-y-6">
          {/* Modo Discreto */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  {privacy.hideValues ? (
                    <EyeOff className="w-5 h-5 text-violet-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-violet-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Modo Discreto</h2>
                  <p className="text-sm text-[var(--text-dimmed)]">Ocultar valores com •••••</p>
                </div>
              </div>
              <button
                onClick={() => updatePrivacy({ hideValues: !privacy.hideValues })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  privacy.hideValues ? "bg-violet-500" : "bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    privacy.hideValues ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {privacy.hideValues && (
              <div className="mt-4 p-4 rounded-xl bg-violet-500/10">
                <p className="text-sm text-[var(--text-muted)]">Exemplo:</p>
                <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">
                  Saldo: <span className="text-violet-400">•••••</span>
                </p>
              </div>
            )}
          </div>

          {/* Bloqueio Automático */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Timer className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bloqueio Automático</h2>
                  <p className="text-sm text-[var(--text-dimmed)]">Bloquear após inatividade</p>
                </div>
              </div>
              <button
                onClick={() => updatePrivacy({ autoLock: !privacy.autoLock })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  privacy.autoLock ? "bg-amber-500" : "bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    privacy.autoLock ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {privacy.autoLock && (
              <div className="pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-muted)] mb-3">Tempo de inatividade</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 15, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => updatePrivacy({ autoLockTime: minutes })}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        privacy.autoLockTime === minutes
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                      }`}
                    >
                      <span className="text-sm text-[var(--text-primary)]">
                        {`${minutes} min`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alterar Senha */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Key className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Alterar Senha</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Atualize sua senha de acesso</p>
              </div>
            </div>

            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full p-4 rounded-xl border-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all font-medium"
              >
                Alterar senha
              </button>
            ) : (
              <div className="space-y-3">
                {/* Feedback messages */}
                {passwordError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-500 text-sm">{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-emerald-500 text-sm">{passwordSuccess}</span>
                  </div>
                )}

                {/* Current password */}
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Senha atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-4 pr-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:opacity-80"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* New password */}
                <div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-4 pr-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:opacity-80"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {newPassword && (
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
                        {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Digite uma senha"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm new password */}
                <div>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      placeholder="Confirmar nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-4 pr-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:opacity-80"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {confirmPassword && (
                    <p
                      className="text-xs mt-2"
                      style={{ color: newPassword === confirmPassword ? "#22c55e" : "#ef4444" }}
                    >
                      {newPassword === confirmPassword ? "Senhas coincidem" : "Senhas não coincidem"}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={resetPasswordForm}
                    disabled={isChangingPassword}
                    className="p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Excluir Conta */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-red-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-400">Excluir Conta</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Remover permanentemente sua conta e dados</p>
              </div>
            </div>

            {!showDeleteAccount ? (
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full p-4 rounded-xl border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
              >
                Excluir minha conta
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">Esta ação é irreversível!</p>
                    <p className="text-xs text-[var(--text-dimmed)] mt-1">
                      Todos os seus dados serão permanentemente excluídos. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Digite 'EXCLUIR' para confirmar"
                  className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-red-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-red-500 mb-3"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowDeleteAccount(false)}
                    className="p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implementar exclusão de conta
                      setShowDeleteAccount(false);
                    }}
                    className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
