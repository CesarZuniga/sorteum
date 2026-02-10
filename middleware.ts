import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export async function middleware(request: NextRequest) {
  // --- Admin route protection (server-side) ---
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Read the Supabase auth tokens from cookies
    const accessToken = request.cookies.get('sb-' + new URL(supabaseUrl).hostname.split('.')[0] + '-auth-token');
    // Supabase stores session as a base64 JSON array in the cookie
    let isAuthenticated = false;

    if (accessToken?.value) {
      try {
        // Supabase JS v2 stores the token as a base64-encoded JSON array [access_token, refresh_token]
        const decoded = JSON.parse(
          Buffer.from(accessToken.value.replace(/^base64-/, ''), 'base64').toString('utf-8')
        );
        const token = Array.isArray(decoded) ? decoded[0] : decoded?.access_token;

        if (token) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const { data: { user }, error } = await supabase.auth.getUser();
          isAuthenticated = !error && !!user;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all request paths except for files in the public folder,
  // and Next.js internal paths.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
