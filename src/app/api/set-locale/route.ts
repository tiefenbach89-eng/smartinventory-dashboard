import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Sprache aus Query lesen
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get('lang') ?? 'en').toLowerCase();

  // Debug: Zeigt im Terminal, was gesetzt wird
  console.log('Active locale:', locale);

  // Antwort mit Cookie + Redirect zur aktuellen Seite
  const response = NextResponse.redirect(request.headers.get('referer') || '/');

  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/', // überall gültig
    maxAge: 60 * 60 * 24 * 365, // 1 Jahr
    sameSite: 'lax'
  });

  return response;
}
