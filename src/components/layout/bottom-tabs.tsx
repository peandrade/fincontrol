"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  FileBarChart,
  Settings,
} from "lucide-react";

const tabItems = [
  {
    label: "Home",
    href: "/",
    icon: LayoutDashboard,
    match: (p: string) => p === "/",
  },
  {
    label: "Invest.",
    href: "/investimentos",
    icon: TrendingUp,
    match: (p: string) => p === "/investimentos",
  },
  {
    label: "Cartões",
    href: "/cartoes",
    icon: CreditCard,
    match: (p: string) => p === "/cartoes",
  },
  {
    label: "Relat.",
    href: "/relatorios",
    icon: FileBarChart,
    match: (p: string) => p === "/relatorios",
  },
  {
    label: "Mais",
    href: "/conta",
    icon: Settings,
    match: (p: string) => p.startsWith("/conta"),
  },
];

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export function BottomTabs() {
  const pathname = usePathname();

  if (authRoutes.includes(pathname)) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t transition-colors duration-300 md:hidden safe-area-bottom"
      style={{
        backgroundColor: "var(--navbar-bg)",
        borderColor: "var(--border-color)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all"
              style={{ color: isActive ? "var(--color-primary)" : "var(--text-muted)" }}
            >
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
