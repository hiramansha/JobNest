// =====================================================
// JOBNEST FIREBASE CONFIGURATION
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCbk-7Ra0E4S0dm_-6QToRWbQ1kcCWvSSI",
    authDomain: "jobnest-ef52b.firebaseapp.com",
    projectId: "jobnest-ef52b",
    storageBucket: "jobnest-ef52b.firebasestorage.app",
    messagingSenderId: "514306326232",
    appId: "1:514306326232:web:44b408c6a3e7893fff61ad",
    measurementId: "G-JHRFCYGBTD"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };