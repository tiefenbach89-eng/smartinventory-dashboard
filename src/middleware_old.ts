import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';

// 1) next-intl Middleware (kein URL-Prefix)
const intl = createIntlMiddleware({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  localePrefix: 'never' // keine /en /de in der URL nötig
});

export async function middleware(req: NextRequest) {
  // Zuerst Locale-Handling (setzt u.a. Cookie NEXT_LOCALE)
  const intlResponse = intl(req);

  // Danach Supabase-Auth verwenden (auf Basis derselben Request/Response)
  const res = NextResponse.next({
    request: {
      headers: req.headers
    }
  });

  // Cookies aus intlResponse in res übernehmen, damit NEXT_LOCALE persistiert
  intlResponse.cookies.getAll().forEach((c) => {
    res.cookies.set(c);
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options);
          }
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Schutz für Dashboard
  if (req.nextUrl.pathname.startsWith('/dashboard') && !user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/sign-in';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Wenn alles ok: die von intl gesetzten Header/Cookies beibehalten
  return res;
}

// Gültig für Dashboard + API (wie zuvor)
// next-intl läuft global, aber unser eigener Matcher bleibt hier bewusst schmal
export const config = {
  matcher: ['/dashboard/:path*', '/(api|trpc)(.*)']
};
