
'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side.
    return initializeFirebase();
  }, []);

  useEffect(() => {
    if (firebaseServices.firebaseApp && firebaseServices.auth && firebaseServices.firestore) {
      setIsInitialized(true);
    }
  }, [firebaseServices]);

  if (!isInitialized) {
    return <div>Loading Firebase...</div>;
  }

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
