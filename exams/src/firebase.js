// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  child,
  get,
} from "firebase/database";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DB_URL", // e.g. https://your-app.firebaseio.com
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export {
  db,
  auth,
  ref,
  push,
  set,
  onValue,
  child,
  get,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
