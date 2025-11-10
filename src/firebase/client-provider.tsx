
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * This component ensures Firebase is initialized only on the client-side
 * and provides the Firebase services to its children. It always renders its
 * children to prevent hydration mismatches.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // useMemo ensures that Firebase is initialized only once per client session.
  const firebaseServices = useMemo(() => {
    // Firebase should only be initialized in the browser.
    if (typeof window === 'undefined') {
      return null;
    }
    return initializeFirebase();
  }, []);

  // If we are on the server, we still render the children wrapped in a provider
  // with null services. The actual FirebaseProvider will handle the loading state
  // on the client.
  if (!firebaseServices) {
    return (
      <FirebaseProvider firebaseApp={null} auth={null} firestore={null}>
        {children}
      </FirebaseProvider>
    );
  }

  // Once Firebase is initialized on the client, provide the actual services.
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
