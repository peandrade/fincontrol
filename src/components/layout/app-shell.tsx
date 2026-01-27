"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sun, Moon } from "lucide-react";
import { useTheme, useUser, useSidebar } from "@/contexts";
import { Sidebar } from "./sidebar";
import { BottomTabs } from "./bottom-tabs";

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { data: session } = useSession();
  const { profile } = useUser();

  if (authRoutes.includes(pathname)) {
    return null;
  }

  const userName = profile?.name || session?.user?.name || session?.user?.email?.split("@")[0] || "U";
  const userImage = profile?.image;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-300 md:hidden"
      style={{
        backgroundColor: "var(--navbar-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center shadow-lg shadow-primary">
            <span className="text-sm">💰</span>
          </div>
          <span
            className="text-lg font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: !mounted || theme === "dark"
                ? "linear-gradient(to right, #ffffff, #9ca3af)"
                : "linear-gradient(to right, #0f172a, #475569)",
            }}
          >
            FinControl
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {mounted ? (
              theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          {session?.user && (
            <button
              onClick={() => router.push("/conta")}
              className="w-8 h-8 rounded-full overflow-hidden"
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2"
                  style={{ borderColor: "var(--color-primary)" }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-gradient flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary">
                  {userInitial}
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  const isAuthPage = authRoutes.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
            isCollapsed ? "md:ml-16" : "md:ml-60"
          }`}
        >
          <MobileHeader />
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <BottomTabs />
    </>
  );
}
