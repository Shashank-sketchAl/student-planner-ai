import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtx8ja5xXGM-SwdgkAEeu8FX6-kbusJIA",
  authDomain: "student-planner-ai.firebaseapp.com",
  projectId: "student-planner-ai",
  storageBucket: "student-planner-ai.firebasestorage.app",
  messagingSenderId: "90560501846",
  appId: "1:90560501846:web:b014a57a15a5a11dbc83f7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);