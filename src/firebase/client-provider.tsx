
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
  // Memoize Firebase initialization so it only runs once.
  const firebaseServices = useMemo(() => {
    // This check is important. It ensures that Firebase is only initialized on the client.
    if (typeof window === 'undefined') {
      return null;
    }
    return initializeFirebase();
  }, []);

  // If the services are not initialized (e.g., on the server), render nothing.
  // This ensures the server-rendered output matches the initial client-render.
  if (!firebaseServices) {
    return null;
  }

  // Once we have the services, we can render the actual provider.
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
