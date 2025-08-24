import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

// Check if Firebase is already initialized
if (getApps().length === 0) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Check if all required Firebase config is present
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      throw new Error('Missing Firebase configuration. Please check your .env file.');
    }

    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    throw error;
  }
}

export const firebaseAuth = getAuth();
export default getApps()[0];
