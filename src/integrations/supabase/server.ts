"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  console.log('SERVER_CLIENT: NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded' : 'NOT LOADED');
  console.log('SERVER_CLIENT: NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'NOT LOADED');

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll();
          console.log(`SERVER_CLIENT: Getting all cookies:`, allCookies.length > 0 ? 'Found' : 'Not Found');
          return allCookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
              console.log(`SERVER_CLIENT: Setting cookie "${name}"`);
            });
          } catch (error) {
            console.error(`SERVER_CLIENT: Error setting cookies:`, error);
          }
        },
      },
    }
  );
}