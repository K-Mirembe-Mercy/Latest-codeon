// CodeOn Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_LR9Kllj7hoKTiJAaSxyHglSO6r5gh-g",
  authDomain: "codeon-3cb1c.firebaseapp.com",
  projectId: "codeon-3cb1c",
  storageBucket: "codeon-3cb1c.firebasestorage.app",
  messagingSenderId: "730172148868",
  appId: "1:730172148868:web:2c712c8124be40019506d1",
  measurementId: "G-EBR3S0M396"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;
