import { Plus_Jakarta_Sans } from 'next/font/google';
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

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: 'Talent Stack',
  description: 'Application de gestion des talents et recrutement',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Talent Stack',
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
        <meta name="theme-color" content="#8AB925" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${jakarta.className} dark:bg-gray-900`}>
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
