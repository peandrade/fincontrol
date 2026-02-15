import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout";
import { ThemeProvider, UserProvider, AppearanceProvider, PreferencesProvider, CurrencyProvider, SidebarProvider, FabProvider } from "@/contexts";
import { SessionProvider } from "@/components/providers/session-provider";
import { AutoLockGuard } from "@/components/providers/auto-lock-guard";
import { ToastProvider } from "@/components/ui/toast";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "CifraCash",
  description: "Gerencie suas finanças de forma simples e visual",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased min-h-screen overflow-x-hidden">
        <SessionProvider>
          <UserProvider>
            <AppearanceProvider>
              <ThemeProvider>
                <ToastProvider>
                  <NextIntlClientProvider messages={messages} locale={locale}>
                    <PreferencesProvider>
                    <CurrencyProvider>
                      <SidebarProvider>
                        <FabProvider>
                          <AutoLockGuard>
                            <AppShell>{children}</AppShell>
                          </AutoLockGuard>
                        </FabProvider>
                      </SidebarProvider>
                    </CurrencyProvider>
                    </PreferencesProvider>
                  </NextIntlClientProvider>
                </ToastProvider>
              </ThemeProvider>
            </AppearanceProvider>
          </UserProvider>
        </SessionProvider>
      </body>
    </html>
  );
}