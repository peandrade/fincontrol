import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout";
import { ThemeProvider, UserProvider, AppearanceProvider } from "@/contexts";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "FinControl - Controle Financeiro Pessoal",
  description: "Gerencie suas finanças de forma simples e visual",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💰</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <SessionProvider>
          <UserProvider>
            <AppearanceProvider>
              <ThemeProvider>
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </ThemeProvider>
            </AppearanceProvider>
          </UserProvider>
        </SessionProvider>
      </body>
    </html>
  );
}