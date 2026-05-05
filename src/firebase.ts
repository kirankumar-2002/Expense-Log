import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "expense-log-kiran",
  appId: "1:608676627450:web:a11d1685110a2188169a43",
  storageBucket: "expense-log-kiran.firebasestorage.app",
  apiKey: "AIzaSyDgb4i4q9V_K65unwkMOXJd4GkF8X1nAJQ",
  authDomain: "expense-log-kiran.firebaseapp.com",
  messagingSenderId: "608676627450",
  measurementId: "G-TFFDN7CVFD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

export { app, auth };

