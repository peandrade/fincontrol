"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  Mail,
  Vibrate,
  PiggyBank,
  Receipt,
  TrendingUp,
} from "lucide-react";

interface NotificationPreferences {
  budgetAlerts: boolean;
  budgetThreshold: number;
  billReminders: boolean;
  reminderDays: number;
  weeklyReport: boolean;
  monthlyReport: boolean;
  sounds: boolean;
  vibration: boolean;
}

const defaultPreferences: NotificationPreferences = {
  budgetAlerts: true,
  budgetThreshold: 80,
  billReminders: true,
  reminderDays: 3,
  weeklyReport: false,
  monthlyReport: true,
  sounds: true,
  vibration: true,
};

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("fincontrol-notification-preferences");
    if (saved) {
      setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
    }
    setIsLoaded(true);
  }, []);

  const updatePreference = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem("fincontrol-notification-preferences", JSON.stringify(newPrefs));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
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
          style={{ backgroundColor: "rgba(245, 158, 11, 0.2)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
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
            Configurações
          </h1>
          <p className="text-[var(--text-dimmed)] mt-1">
            Ajustes avançados e notificações
          </p>
        </div>

        <div className="space-y-6">
          {/* Alertas de Orçamento */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <PiggyBank className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Alertas de Orçamento</h2>
                  <p className="text-sm text-[var(--text-dimmed)]">Avisar quando orçamento estiver acabando</p>
                </div>
              </div>
              <button
                onClick={() => updatePreference("budgetAlerts", !preferences.budgetAlerts)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.budgetAlerts ? "bg-amber-500" : "bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    preferences.budgetAlerts ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {preferences.budgetAlerts && (
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-muted)] mb-3">Alertar quando atingir</p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={preferences.budgetThreshold}
                    onChange={(e) => updatePreference("budgetThreshold", Number(e.target.value))}
                    className="flex-1 h-2 bg-[var(--bg-hover)] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-lg font-semibold text-amber-400 w-16 text-right">
                    {preferences.budgetThreshold}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lembrete de Contas */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <Receipt className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Lembrete de Contas</h2>
                  <p className="text-sm text-[var(--text-dimmed)]">Avisar sobre contas próximas do vencimento</p>
                </div>
              </div>
              <button
                onClick={() => updatePreference("billReminders", !preferences.billReminders)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.billReminders ? "bg-red-500" : "bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    preferences.billReminders ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {preferences.billReminders && (
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-muted)] mb-3">Dias de antecedência</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() => updatePreference("reminderDays", days)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        preferences.reminderDays === days
                          ? "border-red-500 bg-red-500/10"
                          : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                      }`}
                    >
                      <span className="text-sm text-[var(--text-primary)]">{days} {days === 1 ? "dia" : "dias"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Relatórios por Email */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Relatórios por Email</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Receba resumos das suas finanças</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-hover)]">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-primary)]">Resumo Semanal</span>
                </div>
                <button
                  onClick={() => updatePreference("weeklyReport", !preferences.weeklyReport)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    preferences.weeklyReport ? "bg-blue-500" : "bg-[var(--bg-secondary)]"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      preferences.weeklyReport ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-hover)]">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-primary)]">Resumo Mensal</span>
                </div>
                <button
                  onClick={() => updatePreference("monthlyReport", !preferences.monthlyReport)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    preferences.monthlyReport ? "bg-blue-500" : "bg-[var(--bg-secondary)]"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      preferences.monthlyReport ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Sons e Vibração */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <Bell className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sons e Vibração</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Feedback ao registrar transações</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-hover)]">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-primary)]">Sons</span>
                </div>
                <button
                  onClick={() => updatePreference("sounds", !preferences.sounds)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    preferences.sounds ? "bg-violet-500" : "bg-[var(--bg-secondary)]"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      preferences.sounds ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-hover)]">
                <div className="flex items-center gap-3">
                  <Vibrate className="w-5 h-5 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-primary)]">Vibração</span>
                </div>
                <button
                  onClick={() => updatePreference("vibration", !preferences.vibration)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    preferences.vibration ? "bg-violet-500" : "bg-[var(--bg-secondary)]"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      preferences.vibration ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
