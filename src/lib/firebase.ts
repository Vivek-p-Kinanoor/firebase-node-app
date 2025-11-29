"use client";
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDkgFz0aAaIdQNqkz3lJeFio0yo0Fgg0VU",
  authDomain: "bhasha-guard-d-51061324-9f2cb.firebaseapp.com",
  projectId: "bhasha-guard-d-51061324-9f2cb",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: "666507196819",
  appId: "1:666507196819:web:6e39c8c8cb16516bfdd066",
};

// State variables to hold the initialized services
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

// Initialize Firebase once, primarily for the client (browser)
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]; // Get the existing app if already initialized
  }
  
  if (app.name) {
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log("Firebase client app connected.");
  } else {
    throw new Error("Firebase app object is not valid.");
  }

} catch (e) {
  console.error("CRITICAL: Firebase initialization failed in client context.", e);
  app = {} as FirebaseApp;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
  auth = {} as Auth;
}

export { db, storage, auth };