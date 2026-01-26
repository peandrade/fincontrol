"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sliders,
  Home,
  Calendar,
  List,
  AlertTriangle,
  Check,
} from "lucide-react";

interface GeneralPreferences {
  defaultPage: string;
  defaultPeriod: string;
  defaultSort: string;
  confirmBeforeDelete: boolean;
}

const defaultPreferences: GeneralPreferences = {
  defaultPage: "dashboard",
  defaultPeriod: "month",
  defaultSort: "recent",
  confirmBeforeDelete: true,
};

const pages = [
  { id: "dashboard", name: "Dashboard", icon: Home },
  { id: "transactions", name: "Transações", icon: List },
  { id: "investments", name: "Investimentos", icon: Calendar },
];

const periods = [
  { id: "week", name: "Última semana" },
  { id: "month", name: "Este mês" },
  { id: "quarter", name: "Últimos 3 meses" },
  { id: "year", name: "Este ano" },
];

const sortOptions = [
  { id: "recent", name: "Mais recente" },
  { id: "oldest", name: "Mais antigo" },
  { id: "highest", name: "Maior valor" },
  { id: "lowest", name: "Menor valor" },
];

export default function GeralPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<GeneralPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("fincontrol-general-preferences");
    if (saved) {
      setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
    }
    setIsLoaded(true);
  }, []);

  const updatePreference = <K extends keyof GeneralPreferences>(key: K, value: GeneralPreferences[K]) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem("fincontrol-general-preferences", JSON.stringify(newPrefs));
  };

  if (!isLoaded) {
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
            Geral
          </h1>
          <p className="text-[var(--text-dimmed)] mt-1">
            Preferências gerais do sistema
          </p>
        </div>

        <div className="space-y-6">
          {/* Página Inicial */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Home className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Página Inicial</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Qual página abrir ao entrar no app</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {pages.map((page) => {
                const Icon = page.icon;
                const isSelected = preferences.defaultPage === page.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => updatePreference("defaultPage", page.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto ${isSelected ? "text-blue-400" : "text-[var(--text-muted)]"}`} />
                    <p className="text-sm text-[var(--text-primary)] mt-2">{page.name}</p>
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
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Período Padrão</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Período inicial dos relatórios e gráficos</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {periods.map((period) => {
                const isSelected = preferences.defaultPeriod === period.id;
                return (
                  <button
                    key={period.id}
                    onClick={() => updatePreference("defaultPeriod", period.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <p className="text-sm text-[var(--text-primary)]">{period.name}</p>
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
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ordenação Padrão</h2>
                <p className="text-sm text-[var(--text-dimmed)]">Como ordenar listas e transações</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {sortOptions.map((option) => {
                const isSelected = preferences.defaultSort === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => updatePreference("defaultSort", option.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                    }`}
                  >
                    <p className="text-sm text-[var(--text-primary)]">{option.name}</p>
                    {isSelected && (
                      <Check className="w-4 h-4 text-violet-400 mx-auto mt-2" />
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
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Confirmar Exclusão</h2>
                  <p className="text-sm text-[var(--text-dimmed)]">Pedir confirmação antes de excluir itens</p>
                </div>
              </div>
              <button
                onClick={() => updatePreference("confirmBeforeDelete", !preferences.confirmBeforeDelete)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.confirmBeforeDelete ? "bg-amber-500" : "bg-[var(--bg-hover)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    preferences.confirmBeforeDelete ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
