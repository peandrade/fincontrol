"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/lib/admin";
import {
  User,
  Palette,
  Settings,
  Sliders,
  Database,
  Shield,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

const settingsCards = [
  {
    id: "perfil",
    title: "Perfil",
    description: "Gerencie suas informações pessoais",
    icon: User,
    color: "violet",
    href: "/conta/perfil",
  },
  {
    id: "aparencia",
    title: "Aparência",
    description: "Personalize o visual do aplicativo",
    icon: Palette,
    color: "pink",
    href: "/conta/aparencia",
  },
  {
    id: "geral",
    title: "Geral",
    description: "Preferências gerais do sistema",
    icon: Sliders,
    color: "blue",
    href: "/conta/geral",
  },
  {
    id: "configuracoes",
    title: "Configurações",
    description: "Ajustes avançados e notificações",
    icon: Settings,
    color: "amber",
    href: "/conta/configuracoes",
  },
  {
    id: "data",
    title: "Data",
    description: "Exporte e gerencie seus dados",
    icon: Database,
    color: "emerald",
    href: "/conta/data",
  },
  {
    id: "privacidade",
    title: "Privacidade",
    description: "Controle sua privacidade e segurança",
    icon: Shield,
    color: "red",
    href: "/conta/privacidade",
  },
  {
    id: "admin",
    title: "Admin",
    description: "Painel administrativo e feedbacks",
    icon: ShieldCheck,
    color: "cyan",
    href: "/conta/admin",
  },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  violet: {
    bg: "bg-primary-soft",
    icon: "text-primary-color",
    border: "hover:border-[var(--color-primary)]/50",
  },
  pink: {
    bg: "bg-pink-500/10",
    icon: "text-pink-400",
    border: "hover:border-pink-500/50",
  },
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    border: "hover:border-blue-500/50",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    border: "hover:border-amber-500/50",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    border: "hover:border-emerald-500/50",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-400",
    border: "hover:border-red-500/50",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    icon: "text-cyan-400",
    border: "hover:border-cyan-500/50",
  },
};

export default function ContaPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const visibleCards = settingsCards.filter(
    (card) => card.id !== "admin" || (session?.user?.id && isAdmin(session.user.id))
  );

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-secondary) 10%, transparent)" }}
        />
      </div>

      {}
      <div className="relative max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Minha Conta
          </h1>
          <p className="text-[var(--text-dimmed)] mt-1">
            Gerencie suas preferências e configurações
          </p>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            const colors = colorClasses[card.color];

            return (
              <button
                key={card.id}
                onClick={() => router.push(card.href)}
                className={`bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-5 text-left transition-all hover:bg-[var(--bg-hover)] ${colors.border} group`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-dimmed)] group-hover:text-[var(--text-muted)] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">
                  {card.title}
                </h3>
                <p className="text-sm text-[var(--text-dimmed)] mt-1">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
