'use server';

import createSupabaseServerClient from '@/integrations/supabase/server'; // Import the server-side Supabase client as default

export async function signInWithEmailAndPassword(data: {
    email: string;
    password: string;
}) {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    return result;
}

export async function signUpWithEmailAndPassword(data: {
    email: string;
    password: string;
}) {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login` // Asegúrate de que esta variable de entorno esté configurada
        }
    });
    return result;
}