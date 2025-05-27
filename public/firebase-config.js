// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfhqezDrluglFEHEUVGdCK6Vz8dPeBENk",
  authDomain: "rps2v2-1bba0.firebaseapp.com",
  databaseURL: "https://rps2v2-1bba0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rps2v2-1bba0",
  storageBucket: "rps2v2-1bba0.firebasestorage.app",
  messagingSenderId: "536076557177",
  appId: "1:536076557177:web:56c9f40d74190ed12b2da8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 