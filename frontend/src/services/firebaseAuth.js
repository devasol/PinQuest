import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup 
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

// Firebase authentication service
export const firebaseAuthService = {
  // Login with email and password
  login: async (email, password) => {
    try {
      // Validate email and password exist
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      
      // Return user info and token
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        token: idToken
      };
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
      
      const idToken = await user.getIdToken();
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        token: idToken
      };
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

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        token: idToken
      };
    } catch (error) {
      console.error('Firebase Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          error: 'Popup was closed by the user'
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