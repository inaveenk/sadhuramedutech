// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth";
import { getDatabase, ref, set, push, get, child, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL, // ✅ must be correct
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // ✅ do not hardcode URL here

export {
  auth,
  db,
  ref,
  set,
  push,
  get,
  child,
  onValue,
  firebaseSignOut as signOut,
  firebaseSignIn as signInWithEmailAndPassword,
  firebaseCreateUser as createUserWithEmailAndPassword,
  firebaseOnAuthStateChanged as onAuthStateChanged,
};