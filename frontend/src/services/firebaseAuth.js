import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup 
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Firebase authentication service
export const firebaseAuthService = {
  // Helper function to exchange Firebase token for backend JWT token
  exchangeFirebaseToken: async (firebaseToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firebaseToken }),
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        return {
          success: true,
          user: data.data,
          token: data.data.token
        };
      } else {
        throw new Error(data.message || 'Token exchange failed');
      }
    } catch (error) {
      console.error('Firebase token exchange error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Login with email and password
  login: async (email, password) => {
    try {
      // Validate email and password exist
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      const firebaseIdToken = await user.getIdToken();
      
      // Exchange Firebase token for backend JWT token
      const tokenExchangeResult = await firebaseAuthService.exchangeFirebaseToken(firebaseIdToken);
      
      if (tokenExchangeResult.success) {
        return {
          success: true,
          user: {
            _id: tokenExchangeResult.user._id,
            uid: user.uid,
            email: tokenExchangeResult.user.email,
            name: tokenExchangeResult.user.name,
            displayName: user.displayName,
            photoURL: tokenExchangeResult.user.avatar?.url || user.photoURL,
            isVerified: tokenExchangeResult.user.isVerified,
          },
          token: tokenExchangeResult.token
        };
      } else {
        throw new Error(tokenExchangeResult.error || 'Failed to exchange token');
      }
    } catch (error) {
      console.error('Firebase login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sign up with email and password
  signup: async (email, password, displayName) => {
    try {
      // Validate email and password exist
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Update user profile with display name if provided
      if (displayName && user.updateProfile) {
        await user.updateProfile({
          displayName: displayName.trim()
        });
      }
      
      // Wait for a brief moment to ensure the profile is updated before getting the token
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const firebaseIdToken = await user.getIdToken();
      
      // Exchange Firebase token for backend JWT token
      const tokenExchangeResult = await firebaseAuthService.exchangeFirebaseToken(firebaseIdToken);
      
      if (tokenExchangeResult.success) {
        return {
          success: true,
          user: {
            _id: tokenExchangeResult.user._id,
            uid: user.uid,
            email: tokenExchangeResult.user.email,
            name: tokenExchangeResult.user.name,
            displayName: user.displayName,
            photoURL: tokenExchangeResult.user.avatar?.url || user.photoURL,
            isVerified: tokenExchangeResult.user.isVerified,
          },
          token: tokenExchangeResult.token
        };
      } else {
        throw new Error(tokenExchangeResult.error || 'Failed to exchange token');
      }
    } catch (error) {
      console.error('Firebase signup error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Login with Google
  googleLogin: async () => {
    try {
      // Set custom parameters for the Google sign-in
      googleProvider.setCustomParameters({
        prompt: 'select_account' // Forces account selection
      });

      // Use popup method for Google login
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const firebaseIdToken = await user.getIdToken();
      
      // Exchange Firebase token for backend JWT token
      const tokenExchangeResult = await firebaseAuthService.exchangeFirebaseToken(firebaseIdToken);
      
      if (tokenExchangeResult.success) {
        return {
          success: true,
          user: {
            _id: tokenExchangeResult.user._id,
            uid: user.uid,
            email: tokenExchangeResult.user.email,
            name: tokenExchangeResult.user.name,
            displayName: user.displayName,
            photoURL: tokenExchangeResult.user.avatar?.url || user.photoURL,
            isVerified: tokenExchangeResult.user.isVerified,
          },
          token: tokenExchangeResult.token
        };
      } else {
        throw new Error(tokenExchangeResult.error || 'Failed to exchange token');
      }
    } catch (error) {
      console.error('Firebase Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          error: 'Popup was closed by the user'
        };
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.message.includes('popup') || error.message.includes('window.closed')) {
        return {
          success: false,
          error: 'Authentication popup was blocked. Please ensure popups are allowed for this site. For mobile devices, try using the mobile app version.'
        };
      }
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};