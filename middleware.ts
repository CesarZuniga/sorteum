import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'es'];
const defaultLocale = 'es'; // Cambiado a 'es'
const COOKIE_NAME = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
  let locale: string | undefined = request.cookies.get(COOKIE_NAME)?.value;

  if (!locale) {
    // Try to get the locale from the Accept-Language header
    const acceptLanguageHeader = request.headers.get('Accept-Language');
    if (acceptLanguageHeader) {
      const preferredLocales = acceptLanguageHeader.split(',').map(l => l.split(';')[0].trim());
      locale = preferredLocales.find(l => locales.includes(l));
    }
    if (!locale) {
      locale = defaultLocale;
    }
  }

  const response = NextResponse.next();

  // Set the locale cookie if it's not already set or if it was just determined
  if (request.cookies.get(COOKIE_NAME)?.value !== locale) {
    response.cookies.set(COOKIE_NAME, locale, { path: '/', maxAge: 31536000 }); // 1 year
  }

  // Set a header for next-intl to read the locale on the server
  response.headers.set('x-next-intl-locale', locale);

  return response;
}

export const config = {
  // Match all request paths except for files in the public folder,
  // and Next.js internal paths.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};