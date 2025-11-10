
'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  const firebaseServices = useMemo(() => {
    if (typeof window === 'undefined') {
      // On the server, return a dummy object or null
      return null;
    }
    // Initialize Firebase only on the client side.
    return initializeFirebase();
  }, []);

  useEffect(() => {
    // This effect runs only on the client, after initial render.
    setIsMounted(true);
  }, []);

  // Before the component has mounted on the client, or if services are not ready, render nothing.
  // This prevents any child components from trying to access Firebase during SSR or initial hydration.
  if (!isMounted || !firebaseServices) {
    return null; 
  }

  // Once mounted on the client and services are available, render the full provider with children.
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
