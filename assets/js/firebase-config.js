// /assets/js/firebase-config.js

// IMPORTANT: REPLACE WITH YOUR FIREBASE PROJECT CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDxEjWohecLlDOUXzB0LIvZQC1fDiEG8io",
  authDomain: "skill-pro-30bda.firebaseapp.com",
  databaseURL: "https://skill-pro-30bda-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "skill-pro-30bda",
  storageBucket: "skill-pro-30bda.firebasestorage.app",
  messagingSenderId: "927449724793",
  appId: "1:927449724793:web:a37ccd76ccdc055c37a1a8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Create references to the services
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();