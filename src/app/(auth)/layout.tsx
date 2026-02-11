import { ThemeProvider } from "@/contexts";
import { LanguageSelector } from "@/components/auth/language-selector";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {/* Global Language Selector for Auth Pages */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector size="sm" />
        </div>
        {children}
      </div>
    </ThemeProvider>
  );
}
