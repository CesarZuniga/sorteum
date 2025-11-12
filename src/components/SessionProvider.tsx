'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import createSupabaseServerClient from '@/integrations/supabase/server'; // Import the server-side Supabase client as default
// import { useRouter } from 'next/navigation'; // Removed unused import

// createSupabaseServerClient is an async function, so it needs to be called inside an async context or useEffect.
// For a client component, we should use the browser client.
// Let's correct this to use the browser client for client-side components.
import { getSupabaseFrontendClient } from '@/integrations/supabase/client';

const supabase = getSupabaseFrontendClient(); // Use the frontend client for client components

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading

  useEffect(async () => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsLoading(false); // Set loading to false after the initial session is received
    });

    // Cleanup the subscription on component unmount
    return () => subscription.unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}