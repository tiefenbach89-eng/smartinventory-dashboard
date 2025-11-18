import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';

// 1️⃣ Locale-Erkennung konfigurieren
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'de', 'tr'],
  defaultLocale: 'en',
  localePrefix: 'never' // keine /en/ Pfade
});

export async function proxy(request: NextRequest) {
  // 🌐 Locale über next-intl ermitteln
  const intlResponse = intlMiddleware(request);

  // Basis-Response erzeugen
  const response = NextResponse.next({
    request: { headers: request.headers }
  });

  // 🔁 NEXT_LOCALE-Cookie aus intlResponse in unsere Response spiegeln
  intlResponse.cookies.getAll().forEach(({ name, value }) => {
    response.cookies.set(name, value, { path: '/' });
  });

  // 2️⃣ Supabase-Client erzeugen (mit Cookie-Integration)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (
          cookiesToSet: { name: string; value: string; options: any }[]
        ) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  // 👤 Benutzer prüfen
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // 3️⃣ Zugriffsschutz für Dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/sign-in';
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 4️⃣ Response mit allen Cookies & Headers zurückgeben
  return response;
}

// 5️⃣ Next.js 16 Proxy-Konfiguration
export const config = {
  matcher: ['/((?!_next|.*\\..*|api/set-locale).*)']
};
