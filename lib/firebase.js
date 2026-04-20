"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Safely initialize — if config isn't set yet (first run), we export nulls
// so the app doesn't crash. Set your env vars and restart.
export const app = hasConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const db = app ? getFirestore(app) : null;
export const firebaseReady = hasConfig;
