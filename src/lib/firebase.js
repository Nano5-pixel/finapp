import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNUVbdo6ZpJNRf3komODfdcBYH1nR0pVg",
  authDomain: "finapp-882af.firebaseapp.com",
  projectId: "finapp-882af",
  storageBucket: "finapp-882af.firebasestorage.app",
  messagingSenderId: "643172120620",
  appId: "1:643172120620:web:335e0ead188d8fb1d47989"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);