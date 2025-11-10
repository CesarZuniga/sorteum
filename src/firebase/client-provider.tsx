
'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * This component ensures Firebase is initialized only on the client-side
 * and defers rendering its children until the client has mounted and Firebase services are available.
 * This prevents hydration mismatches and race conditions with Firebase hooks.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Memoize Firebase initialization so it only runs once.
  const firebaseServices = useMemo(() => {
    // This check is important. It ensures that Firebase is only initialized on the client.
    if (typeof window === 'undefined') {
      return null;
    }
    return initializeFirebase();
  }, []);

  // Use useEffect to set isMounted to true only on the client, after the initial render.
  useEffect(() => {
    setIsMounted(true);
  }, []);


  // On the server, and on the initial client render, return null to match the server output.
  if (!isMounted || !firebaseServices) {
    return null;
  }

  // Once the component is mounted on the client and we have the services, render the actual provider.
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
