"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Mail,
  Vibrate,
  PiggyBank,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { usePreferences } from "@/contexts";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { notifications, updateNotifications, isLoading, isSaving } = usePreferences();

  if (isLoading) {
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

      <div className="relative max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
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
              Configurações
            </h1>
            <p className="text-[var(--text-dimmed)] mt-1">
              Ajustes avançados e notificações
            </p>
          </div>
          {isSaving && (
            <span className="text-sm text-[var(--text-muted)] animate-pulse">Salvando...</span>
          )}
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
                onClick={() => updateNotifications({ budgetAlerts: !notifications.budgetAlerts })}
                className={`
                  relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
                  flex items-center px-0.5
                  ${notifications.budgetAlerts ? "bg-amber-500" : "bg-[var(--bg-hover)]"}
                `}
                role="switch"
                aria-checked={notifications.budgetAlerts}
              >
                <span
                  className={`
                    w-6 h-6 rounded-full bg-white shadow-md
                    transition-transform duration-200 ease-in-out
                    ${notifications.budgetAlerts ? "translate-x-[26px]" : "translate-x-0"}
                  `}
                />
              </button>
            </div>

            {notifications.budgetAlerts && (
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-muted)] mb-3">Alertar quando atingir</p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={notifications.budgetThreshold}
                    onChange={(e) => updateNotifications({ budgetThreshold: Number(e.target.value) })}
                    className="flex-1 h-2 bg-[var(--bg-hover)] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-lg font-semibold text-amber-400 w-16 text-right">
                    {notifications.budgetThreshold}%
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
                onClick={() => updateNotifications({ billReminders: !notifications.billReminders })}
                className={`
                  relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
                  flex items-center px-0.5
                  ${notifications.billReminders ? "bg-red-500" : "bg-[var(--bg-hover)]"}
                `}
                role="switch"
                aria-checked={notifications.billReminders}
              >
                <span
                  className={`
                    w-6 h-6 rounded-full bg-white shadow-md
                    transition-transform duration-200 ease-in-out
                    ${notifications.billReminders ? "translate-x-[26px]" : "translate-x-0"}
                  `}
                />
              </button>
            </div>

            {notifications.billReminders && (
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-muted)] mb-3">Dias de antecedência</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() => updateNotifications({ reminderDays: days })}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        notifications.reminderDays === days
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
                  onClick={() => updateNotifications({ weeklyReport: !notifications.weeklyReport })}
                  className={`
                    relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
                    flex items-center px-0.5
                    ${notifications.weeklyReport ? "bg-blue-500" : "bg-[var(--bg-secondary)]"}
                  `}
                  role="switch"
                  aria-checked={notifications.weeklyReport}
                >
                  <span
                    className={`
                      w-6 h-6 rounded-full bg-white shadow-md
                      transition-transform duration-200 ease-in-out
                      ${notifications.weeklyReport ? "translate-x-[26px]" : "translate-x-0"}
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-hover)]">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-primary)]">Resumo Mensal</span>
                </div>
                <button
                  onClick={() => updateNotifications({ monthlyReport: !notifications.monthlyReport })}
                  className={`
                    relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
                    flex items-center px-0.5
                    ${notifications.monthlyReport ? "bg-blue-500" : "bg-[var(--bg-secondary)]"}
                  `}
                  role="switch"
                  aria-checked={notifications.monthlyReport}
                >
                  <span
                    className={`
                      w-6 h-6 rounded-full bg-white shadow-md
                      transition-transform duration-200 ease-in-out
                      ${notifications.monthlyReport ? "translate-x-[26px]" : "translate-x-0"}
                    `}
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
                  onClick={() => updateNotifications({ sounds: !notifications.sounds })}
                  className={`
                    relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
                    flex items-center px-0.5
                    ${notifications.sounds ? "bg-violet-500" : "bg-[var(--bg-secondary)]"}
                  `}
                  role="switch"
                  aria-checked={notifications.sounds}
                >
                  <span
                    className={`
                      w-6 h-6 rounded-full bg-white shadow-md
                      transition-transform duration-200 ease-in-out
                      ${notifications.sounds ? "translate-x-[26px]" : "translate-x-0"}
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-hover)] sm:hidden">
                <div className="flex items-center gap-3">
                  <Vibrate className="w-5 h-5 text-[var(--text-muted)]" />
                  <span className="text-[var(--text-primary)]">Vibração</span>
                </div>
                <button
                  onClick={() => updateNotifications({ vibration: !notifications.vibration })}
                  className={`
                    relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0
                    flex items-center px-0.5
                    ${notifications.vibration ? "bg-violet-500" : "bg-[var(--bg-secondary)]"}
                  `}
                  role="switch"
                  aria-checked={notifications.vibration}
                >
                  <span
                    className={`
                      w-6 h-6 rounded-full bg-white shadow-md
                      transition-transform duration-200 ease-in-out
                      ${notifications.vibration ? "translate-x-[26px]" : "translate-x-0"}
                    `}
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
