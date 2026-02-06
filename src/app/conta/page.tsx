"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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
    titleKey: "profile",
    descKey: "profileDesc",
    icon: User,
    color: "violet",
    href: "/conta/perfil",
  },
  {
    id: "aparencia",
    titleKey: "appearance",
    descKey: "appearanceDesc",
    icon: Palette,
    color: "pink",
    href: "/conta/aparencia",
  },
  {
    id: "geral",
    titleKey: "general",
    descKey: "generalDesc",
    icon: Sliders,
    color: "blue",
    href: "/conta/geral",
  },
  {
    id: "configuracoes",
    titleKey: "config",
    descKey: "configDesc",
    icon: Settings,
    color: "amber",
    href: "/conta/configuracoes",
  },
  {
    id: "data",
    titleKey: "data",
    descKey: "dataDesc",
    icon: Database,
    color: "emerald",
    href: "/conta/data",
  },
  {
    id: "privacidade",
    titleKey: "privacy",
    descKey: "privacyDesc",
    icon: Shield,
    color: "red",
    href: "/conta/privacidade",
  },
  {
    id: "admin",
    titleKey: "admin",
    descKey: "adminDesc",
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
  const t = useTranslations("settings");

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
            {t("myAccount")}
          </h1>
          <p className="text-[var(--text-dimmed)] mt-1">
            {t("myAccountDesc")}
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
                  {t(card.titleKey)}
                </h3>
                <p className="text-sm text-[var(--text-dimmed)] mt-1">
                  {t(card.descKey)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
