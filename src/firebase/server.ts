// src/firebase/server.ts
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This function is for server-side initialization
export function initializeFirebaseServer() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp)
    };
  } else {
    const firebaseApp = getApp();
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp)
    };
  }
}
