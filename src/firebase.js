import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, setUserProperties, logEvent } from "firebase/analytics";

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
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Analytics Helpers
export const setAnalyticsUserPlan = (plan) => {
  if (analytics) {
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname === 'expenselog.local');
    setUserProperties(analytics, { plan_type: plan, debug_mode: isLocal });
  }
};

export const logAnalyticsEvent = (name, params) => {
  if (analytics) {
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname === 'expenselog.local');
    logEvent(analytics, name, { ...params, debug_mode: isLocal });
  }
};
export default app;
