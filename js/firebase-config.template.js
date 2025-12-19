// Firebase Configuration Template
// INSTRUCTIONS:
// 1. Copy this file to 'firebase-config.js' (in the same directory)
// 2. Replace the placeholder values with your actual Firebase project credentials
// 3. Get these values from: Firebase Console > Project Settings > Your Apps > Web App

// Firebase SDK Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
