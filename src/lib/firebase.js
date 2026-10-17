import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Config comes from REACT_APP_FIREBASE_* env vars (see .env.example).
// Without them the app still works, just on this device only.
const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const syncAvailable = Boolean(config.apiKey && config.projectId && config.appId);

let db = null;
let authReady = Promise.resolve(false);

if (syncAvailable) {
  const app = initializeApp(config);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  const auth = getAuth(app);
  authReady = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) resolve(true);
      else signInAnonymously(auth).catch(() => resolve(false));
    });
  });
}

export { db, authReady };

// Household codes: 6 characters, no look-alikes (0/O, 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeHouseholdCode() {
  const bytes = new Uint8Array(6);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function normaliseCode(input) {
  return (input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
