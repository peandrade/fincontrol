"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  FileBarChart,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronsLeft,
  ChevronsRight,
  Github,
  Linkedin,
} from "lucide-react";
import { useTheme, useUser, useSidebar } from "@/contexts";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Investimentos",
    href: "/investimentos",
    icon: TrendingUp,
  },
  {
    label: "Cartões",
    href: "/cartoes",
    icon: CreditCard,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: FileBarChart,
  },
];

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { data: session } = useSession();
  const { profile } = useUser();
  const { isCollapsed, toggleSidebar } = useSidebar();

  if (authRoutes.includes(pathname)) {
    return null;
  }

  const userName = profile?.name || session?.user?.name || session?.user?.email?.split("@")[0] || "U";
  const userEmail = profile?.email || session?.user?.email || "";
  const userImage = profile?.image;
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 backdrop-blur-xl border-r transition-all duration-300 hidden md:flex flex-col ${
        isCollapsed ? "w-16" : "w-60"
      }`}
      style={{
        backgroundColor: "var(--navbar-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 border-b ${isCollapsed ? "justify-center px-2" : "px-4"}`} style={{ borderColor: "var(--border-color)" }}>
        <Link href="/" className={`flex items-center ${isCollapsed ? "" : "gap-3"}`}>
          <div className="w-9 h-9 rounded-xl bg-primary-gradient flex items-center justify-center shadow-lg shadow-primary shrink-0">
            <span className="text-lg">💰</span>
          </div>
          {!isCollapsed && (
            <span
              className="text-xl font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage: !mounted || theme === "dark"
                  ? "linear-gradient(to right, #ffffff, #9ca3af)"
                  : "linear-gradient(to right, #0f172a, #475569)",
              }}
            >
              FinControl
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl font-medium transition-all ${
                isCollapsed ? "justify-center p-3" : "px-4 py-2.5"
              } ${
                isActive
                  ? "bg-primary-gradient text-white shadow-lg shadow-primary"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t px-2 py-3 space-y-1" style={{ borderColor: "var(--border-color)" }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 w-full rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] ${
            isCollapsed ? "justify-center p-3" : "px-4 py-2.5"
          }`}
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="w-5 h-5 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 shrink-0" />
            )
          ) : (
            <Sun className="w-5 h-5 shrink-0" />
          )}
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {mounted ? (theme === "dark" ? "Tema claro" : "Tema escuro") : "Tema"}
            </span>
          )}
        </button>

        {/* User info */}
        {session?.user && (
          <>
            <div className={`flex items-center gap-3 px-2 py-2 ${isCollapsed ? "justify-center" : ""}`}>
              {userImage ? (
                <img
                  src={userImage}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 shrink-0"
                  style={{ borderColor: "var(--color-primary)" }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-gradient flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary shrink-0">
                  {userInitial}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {userName}
                  </p>
                  <p className="text-[10px] text-[var(--text-dimmed)] truncate">
                    {userEmail}
                  </p>
                </div>
              )}
            </div>

            {/* Minha Conta */}
            <button
              onClick={() => router.push("/conta")}
              className={`flex items-center gap-3 w-full rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] ${
                isCollapsed ? "justify-center p-3" : "px-4 py-2.5"
              }`}
              title={isCollapsed ? "Minha Conta" : undefined}
            >
              <User className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Minha Conta</span>}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full rounded-xl transition-all text-red-400 hover:bg-red-500/10 ${
                isCollapsed ? "justify-center p-3" : "px-4 py-2.5"
              }`}
              title={isCollapsed ? "Sair" : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
            </button>
          </>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={`flex items-center gap-3 w-full rounded-xl transition-all text-[var(--text-dimmed)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] ${
            isCollapsed ? "justify-center p-3" : "px-4 py-2.5"
          }`}
          title={isCollapsed ? "Expandir" : "Recolher"}
        >
          {isCollapsed ? (
            <ChevronsRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Recolher</span>
            </>
          )}
        </button>

        {/* Social links */}
        <div className={`flex items-center pt-2 border-t ${isCollapsed ? "justify-center gap-1" : "gap-3 px-2"}`} style={{ borderColor: "var(--border-color)" }}>
          <a
            href="https://github.com/peandrade"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg transition-all text-[var(--text-dimmed)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/pedro-andrade-santos/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg transition-all text-[var(--text-dimmed)] hover:text-[#0A66C2] hover:bg-[var(--bg-hover)]"
            title="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>
      </div>
    </aside>
  );
}
