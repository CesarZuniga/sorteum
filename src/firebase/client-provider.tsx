
'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * This component ensures Firebase is initialized only on the client-side
 * and defers rendering its children until the client has mounted.
 * This prevents hydration mismatches.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Use useEffect to set isMounted to true only on the client, after the initial render.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoize Firebase initialization so it only runs once.
  const firebaseServices = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return initializeFirebase();
  }, []);

  // While not mounted on the client, render nothing to match the server's output for this provider.
  if (!isMounted) {
    return null;
  }

  // Once mounted, provide the actual services.
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices?.firebaseApp ?? null}
      auth={firebaseServices?.auth ?? null}
      firestore={firebaseServices?.firestore ?? null}
    >
      {children}
    </FirebaseProvider>
  );
}
