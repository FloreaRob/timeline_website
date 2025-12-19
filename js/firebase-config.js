// Firebase Configuration Template
// INSTRUCTIONS:
// 1. Copy this file to 'firebase-config.js' (in the same directory)
// 2. Replace the placeholder values with your actual Firebase project credentials
// 3. Get these values from: Firebase Console > Project Settings > Your Apps > Web App

// Firebase SDK Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGwZoVYL4MMe6OqiAgVyD9u65c8EeeJBo",
  authDomain: "music-timeline-8973c.firebaseapp.com",
  projectId: "music-timeline-8973c",
  storageBucket: "music-timeline-8973c.firebasestorage.app",
  messagingSenderId: "646313021874",
  appId: "1:646313021874:web:70f9dc881cd3313f1e54ab"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for better UX
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser doesn\'t support persistence');
    }
  });

// Auth persistence (keep users logged in)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

console.log('Firebase initialized successfully');
