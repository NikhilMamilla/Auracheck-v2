// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, disableNetwork, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Try to enable persistence, but don't block on error
enableIndexedDbPersistence(db).catch((err) => {
  console.log('Persistence could not be enabled: ', err.message);
});

// Reset Firestore connection if issues occur
export const resetFirestoreConnection = async () => {
  try {
    console.log("Resetting Firestore connection...");
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    await enableNetwork(db);
    console.log("Firestore connection reset complete");
    return true;
  } catch (error) {
    console.error("Error resetting Firestore connection:", error);
    return false;
  }
};

export { auth, db, storage };