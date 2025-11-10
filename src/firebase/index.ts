'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';


// This is the client-side initialization function
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      // Always initialize with the explicit config.
      const firebaseApp = initializeApp(firebaseConfig);
      return getSdks(firebaseApp);
    }
    // If apps are already initialized, get the default app
    return getSdks(getApp());
  }
  // This case should ideally not be hit on the client.
  // If it is, it means server-side code is trying to call a client function.
  throw new Error("Firebase cannot be initialized on the server via this function.");
}


export function getSdks(firebaseApp: FirebaseApp): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; storage: FirebaseStorage; } {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

    