import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdMVcbfLLuoHMqj2KXTMs6WYaNI1qeq7A",
  authDomain: "shack-30405.firebaseapp.com",
  projectId: "shack-30405",
  storageBucket: "shack-30405.firebasestorage.app",
  messagingSenderId: "308499844935",
  appId: "1:308499844935:web:38483e0b8f992eefc24662",
  measurementId: "G-XCVRMWGHHF"
};

// Initialize Firebase client app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
