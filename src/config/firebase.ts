import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging - show actual values
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'Missing',
  authDomain: firebaseConfig.authDomain || 'Missing',
  projectId: firebaseConfig.projectId || 'Missing',
  storageBucket: firebaseConfig.storageBucket || 'Missing',
  messagingSenderId: firebaseConfig.messagingSenderId || 'Missing',
  appId: firebaseConfig.appId ? firebaseConfig.appId.substring(0, 10) + '...' : 'Missing',
});

// Check if all required config is present
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error('❌ Missing Firebase configuration fields:', missingFields);
  throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

export { auth };
export default app;
