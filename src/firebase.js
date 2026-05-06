import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Analytics Helpers
export const setAnalyticsUserPlan = (plan) => {
  if (analytics) {
    setUserProperties(analytics, { plan_type: plan });
  }
};

export const logAnalyticsEvent = (name, params) => {
  if (analytics) {
    logEvent(analytics, name, params);
  }
};
export default app;
