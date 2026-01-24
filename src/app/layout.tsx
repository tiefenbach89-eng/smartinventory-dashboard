import { AppVersionGuard } from '@/components/system/AppVersionGuard';
import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/lib/font';
import ThemeProvider from '@/components/layout/ThemeToggle/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import AuthBootstrap from '@/components/auth-bootstrap';
import './globals.css';
import './theme.css';

// 🌐 i18n
import { NextIntlClientProvider } from 'next-intl';

// verhindert jegliches Caching -> Cookie wird bei jedem Request gelesen
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
};

export const metadata: Metadata = {
  title: 'SmartInventory Dashboard',
  description: 'Realtime warehouse tracking and analytics dashboard'
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  // 🔹 Sprache direkt aus Cookie lesen (inkl. Deutsch & Türkisch)
  const locale = (cookieStore.get('NEXT_LOCALE')?.value ?? 'en') as
    | 'en'
    | 'de'
    | 'tr';

  // 🔹 Übersetzungen laden
  const dictionaries = {
    en: async () => (await import('../../i18n/messages/en.json')).default,
    de: async () => (await import('../../i18n/messages/de.json')).default,
    tr: async () => (await import('../../i18n/messages/tr.json')).default
  } as const;

  const messages = await dictionaries[locale]();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        activeThemeValue ? `theme-${activeThemeValue}` : '',
        isScaled ? 'theme-scaled' : ''
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (
                  localStorage.theme === 'dark' ||
                  ((!('theme' in localStorage) || localStorage.theme === 'system') &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches)
                ) {
                  document
                    .querySelector('meta[name="theme-color"]')
                    ?.setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `
          }}
        />
      </head>

      <body
        className={cn(
          'bg-background overflow-x-hidden overflow-y-auto overscroll-none font-sans antialiased',
          fontVariables
        )}
      >
        <NextTopLoader color='var(--primary)' showSpinner={false} />

        <NuqsAdapter>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <AppVersionGuard />

            {/* 🌍 next-intl Provider */}
            <NextIntlClientProvider locale={locale} messages={messages}>
              <Providers activeThemeValue={activeThemeValue as string}>
                <Toaster />
                {children}
                <AuthBootstrap />
              </Providers>
            </NextIntlClientProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
