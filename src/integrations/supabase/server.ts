import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() { // Hacemos la función async
  const cookieStore = cookies();

  console.log('SERVER_CLIENT: NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded' : 'NOT LOADED');
  console.log('SERVER_CLIENT: NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'NOT LOADED');

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieValue = await cookieStore.get(name)?.value; 
          console.log(`SERVER_CLIENT: Getting cookie "${name}":`, cookieValue ? 'Found' : 'Not Found');
          return cookieValue;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
            console.log(`SERVER_CLIENT: Setting cookie "${name}"`);
          } catch (error) {
            // The `cookies().set()` method can only be called in a Server Action or Route Handler.
            // This error is safe to ignore if you're only reading cookies in a Server Component.
            console.error(`SERVER_CLIENT: Error setting cookie "${name}":`, error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
            console.log(`SERVER_CLIENT: Removing cookie "${name}"`);
          } catch (error) {
            // The `cookies().set()` method can only be called in a Server Action or Route Handler.
            // This error is safe to ignore if you're only reading cookies in a Server Component.
            console.error(`SERVER_CLIENT: Error removing cookie "${name}":`, error);
          }
        },
      },
    }
  );
}