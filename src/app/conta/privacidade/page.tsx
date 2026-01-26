"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Timer,
  Key,
  Trash2,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface PrivacyPreferences {
  hideValues: boolean;
  autoLock: boolean;
  autoLockTime: number;
  requireAuth: boolean;
}

const defaultPreferences: PrivacyPreferences = {
  hideValues: false,
  autoLock: false,
  autoLockTime: 5,
  requireAuth: false,
};

export default function PrivacidadePage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<PrivacyPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("fincontrol-privacy-preferences");
    if (saved) {
      setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
    }
    setIsLoaded(true);
  }, []);

  const updatePreference = <K extends keyof PrivacyPreferences>(key: K, value: PrivacyPreferences[K]) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem("fincontrol-privacy-preferences", JSON.stringify(newPrefs));
  };

  if (!isLoaded) {
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

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Privacidade
          </h1>
          <p className="text-[var(--text-dimmed)] mt-1">
            Controle sua privacidade e segurança
          </p>
        </div>

        <div className="space-y-6">
          {/* Modo Discreto */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  {preferences.hideValues ? (
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
                onClick={() => updatePreference("hideValues", !preferences.hideValues)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.hideValues ? "bg-violet-500" : "bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    preferences.hideValues ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {preferences.hideValues && (
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
                onClick={() => updatePreference("autoLock", !preferences.autoLock)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.autoLock ? "bg-amber-500" : "bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    preferences.autoLock ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {preferences.autoLock && (
              <div className="pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-muted)] mb-3">Tempo de inatividade</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 15, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => updatePreference("autoLockTime", minutes)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        preferences.autoLockTime === minutes
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                      }`}
                    >
                      <span className="text-sm text-[var(--text-primary)]">{minutes} min</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Exigir Autenticação */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Exigir Autenticação</h2>
                  <p className="text-sm text-[var(--text-dimmed)]">Biometria ou senha para abrir o app</p>
                </div>
              </div>
              <button
                onClick={() => updatePreference("requireAuth", !preferences.requireAuth)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.requireAuth ? "bg-emerald-500" : "bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    preferences.requireAuth ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
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
                <input
                  type="password"
                  placeholder="Senha atual"
                  className="w-full p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="Nova senha"
                  className="w-full p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-blue-500"
                />
                <input
                  type="password"
                  placeholder="Confirmar nova senha"
                  className="w-full p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowChangePassword(false)}
                    className="p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implementar alteração de senha
                      setShowChangePassword(false);
                    }}
                    className="p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all"
                  >
                    Salvar
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
