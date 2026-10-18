import { Sora } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import '../globals.css';
import "flatpickr/dist/flatpickr.css";
import { routing, RTL_LOCALES } from '@/i18n/routing';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { StoreProvider } from '@/lib/StoreProvider';
import AuthInitializer from '@/components/auth/AuthInitializer';
import PermissionsRefresher from '@/components/auth/PermissionsRefresher';
import GlobalToaster from '@/components/common/GlobalToaster';

// Police de la charte TALOPSIA. Sora est une police variable : sans `weight`
// explicite, tous les poids (Light 300 → ExtraBold 800) sont disponibles.
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora-next",
  display: "swap",
});

export const metadata = {
  title: 'TALOPSIA — The AI Talent Operating System',
  description: 'Application de gestion des talents et recrutement',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TALOPSIA',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const dir = RTL_LOCALES.includes(locale as (typeof RTL_LOCALES)[number]) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        <meta name="theme-color" content="#3B82F6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${sora.className} ${sora.variable} dark:bg-gray-900`}>
        <NextIntlClientProvider>
          <StoreProvider>
            <AuthInitializer />
            <PermissionsRefresher />
            <GlobalToaster />
            <ThemeProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </ThemeProvider>
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
