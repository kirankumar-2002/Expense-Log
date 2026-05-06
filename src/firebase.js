import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  projectId: "expense-log-kiran",
  appId: "1:608676627450:web:a11d1685110a2188169a43",
  storageBucket: "expense-log-kiran.firebasestorage.app",
  apiKey: "AIzaSyDgb4i4q9V_K65unwkMOXJd4GkF8X1nAJQ",
  authDomain: "expense-log-kiran.firebaseapp.com",
  messagingSenderId: "608676627450",
  measurementId: "G-TFFDN7CVFD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
