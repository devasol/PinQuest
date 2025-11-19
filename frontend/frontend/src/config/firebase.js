// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAslFpF-R3gQxobqJ23HO7-dATiQjlZRes",
  authDomain: "pin-quest-595fb.firebaseapp.com",
  projectId: "pin-quest-595fb",
  storageBucket: "pin-quest-595fb.firebasestorage.app",
  messagingSenderId: "1033153541677",
  appId: "1:1033153541677:web:5b80aa5aab02da1f25aaa4",
  measurementId: "G-QNNZ25NLNP",
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Google provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
