import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-9zR8cTFgratwunEQ6qOzKxL15XcxAHA",
  authDomain: "triage-hackathon.firebaseapp.com",
  projectId: "triage-hackathon",
  storageBucket: "triage-hackathon.firebasestorage.app",
  messagingSenderId: "1013574430074",
  appId: "1:1013574430074:web:f4367a9855a379547b7ac3"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}