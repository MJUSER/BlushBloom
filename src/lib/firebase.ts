import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDE5SA7S2OJtG1V9_E4LhFZDj3D2EDq_lo",
    authDomain: "blushandbloom-59477.firebaseapp.com",
    projectId: "blushandbloom-59477",
    storageBucket: "blushandbloom-59477.firebasestorage.app",
    messagingSenderId: "874203224238",
    appId: "1:874203224238:web:cdd3987722a1ac53baf53f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
// Enable Offline Persistence (Multi-tab)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export default app;
