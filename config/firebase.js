import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
const firebaseConfig = {
  apiKey: "AIzaSyBcUcbMdtTTItXvG0nvQKLKNisYjSrf2A4",
  authDomain: "finalproject-42f84.firebaseapp.com",
  projectId: "finalproject-42f84",
  storageBucket: "finalproject-42f84.firebasestorage.app",
  messagingSenderId: "1060761116692",
  appId: "1:1060761116692:web:0fb27bf4f7ab6b1e91c701"
};

// 1. App Init
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Auth Init - The "Singleton" Pattern
let auth;
if (getApps().length > 0) {
  try {
    auth = getAuth(app); // Try to get existing
  } catch (e) {
    // This is where we force AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export { auth, app };