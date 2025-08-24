import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../src/config/firebase';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'business';
  createdAt: string;
  biometricEnabled: boolean;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  vaultUnlocked: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  signout: () => Promise<void>;
  forceLogout: () => Promise<void>;
  unlockVault: (method: 'password' | 'biometric') => Promise<boolean>;
  lockVault: () => void;
  toggleBiometric: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  resetAuth: () => void;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: false,
  biometricEnabled: false,
  vaultUnlocked: false,

  initializeAuth: async () => {
    try {
      // Check if biometric is available and enabled
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');
        set({ biometricEnabled: biometricEnabled === 'true' });
      }

      // Listen to Firebase auth state changes but don't auto-authenticate
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Only set Firebase user, don't automatically authenticate
          set({ firebaseUser });
          
          // Don't automatically fetch user data or set as authenticated
          // User must explicitly sign in through the auth screen
        } else {
          set({ 
            firebaseUser: null, 
            user: null, 
            isAuthenticated: false, 
            vaultUnlocked: false 
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  },

  signin: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      console.log('🔐 Starting signin process...');
      console.log('📱 API Base URL:', API_BASE_URL);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase authentication successful:', firebaseUser.uid);
      
      // Get user data from backend
      const token = await firebaseUser.getIdToken();
      console.log('🔑 Got Firebase ID token, calling backend...');
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Backend response status:', response.status);
      
      if (response.ok) {
        const { user } = await response.json();
        console.log('✅ User data fetched successfully:', user);
        set({ 
          user, 
          firebaseUser,
          isAuthenticated: true, 
          vaultUnlocked: true,
          isLoading: false 
        });
      } else if (response.status === 404) {
        // User doesn't exist in backend, create them
        console.log('🆕 User not found in backend, creating new user...');
        const userData = {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0]
        };
        
        const createResponse = await fetch(`${API_BASE_URL}/auth/link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        
        if (createResponse.ok) {
          const { user } = await createResponse.json();
          console.log('✅ User created in backend successfully:', user);
          set({ 
            user, 
            firebaseUser,
            isAuthenticated: true, 
            vaultUnlocked: true,
            isLoading: false 
          });
        } else {
          const errorText = await createResponse.text();
          console.error('❌ Failed to create user in backend:', createResponse.status, errorText);
          throw new Error(`Failed to create user: ${createResponse.status} - ${errorText}`);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Signin error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true });
    try {
      console.log('🔐 Starting signup process...');
      console.log('📱 API Base URL:', API_BASE_URL);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase user created successfully:', firebaseUser.uid);
      
      // Create user in backend
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName
      };
      
      console.log('📡 Creating user in backend...');
      const response = await fetch(`${API_BASE_URL}/auth/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      console.log('📡 Backend response status:', response.status);
      
      if (response.ok) {
        const { user } = await response.json();
        console.log('✅ User created in backend successfully:', user);
        set({ 
          user, 
          firebaseUser,
          isAuthenticated: true, 
          vaultUnlocked: true,
          isLoading: false 
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signout: async () => {
    try {
      await firebaseSignOut(auth);
      set({ 
        user: null, 
        firebaseUser: null,
        isAuthenticated: false, 
        vaultUnlocked: false 
      });
    } catch (error) {
      console.error('Signout error:', error);
    }
  },

  forceLogout: async () => {
    try {
      // Force sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear all local state
      set({ 
        user: null, 
        firebaseUser: null,
        isAuthenticated: false, 
        vaultUnlocked: false,
        biometricEnabled: false,
        isLoading: false
      });
      
      // Clear any stored authentication data
      await AsyncStorage.removeItem('biometricEnabled');
      
      console.log('✅ Force logout completed - all auth state cleared');
    } catch (error) {
      console.error('Force logout error:', error);
    }
  },

  unlockVault: async (method: 'password' | 'biometric') => {
    set({ isLoading: true });
    try {
      if (method === 'biometric') {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock your vault',
          fallbackLabel: 'Use password',
          cancelLabel: 'Cancel'
        });
        
        if (result.success) {
          set({ vaultUnlocked: true, isLoading: false });
          return true;
        } else {
          set({ isLoading: false });
          return false;
        }
      } else {
        // Password unlock - vault is already unlocked after signin
        set({ vaultUnlocked: true, isLoading: false });
        return true;
      }
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  lockVault: () => {
    set({ vaultUnlocked: false });
  },

  toggleBiometric: async () => {
    try {
      const newValue = !get().biometricEnabled;
      await AsyncStorage.setItem('biometricEnabled', newValue.toString());
      set({ biometricEnabled: newValue });
    } catch (error) {
      console.error('Error toggling biometric:', error);
    }
  },

  resetAuth: () => {
    set({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      vaultUnlocked: false,
      biometricEnabled: false,
      isLoading: false,
    });
  },
}));