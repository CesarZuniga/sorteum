
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
    // This effect runs only on the client, after hydration.
    setIsMounted(true);
  }, []);

  // On the server, or on the client before it has mounted, render nothing or a placeholder
  // that matches the server. This avoids the hydration mismatch.
  if (!isMounted || !firebaseServices) {
    // To avoid layout shift, you might render a skeleton UI here
    // that matches the server-rendered layout. For now, returning children is simplest.
    // If children also depend on Firebase, they must handle the loading state.
    // A simple loading div can also work if the mismatch is handled correctly.
     return <div>Loading Firebase...</div>;
  }

  // Once mounted on the client and services are available, render the full provider.
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
