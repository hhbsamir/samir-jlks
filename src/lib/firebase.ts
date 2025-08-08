// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "jlks-paradip",
  "appId": "1:168780164501:web:0d528092ea0ff558609a9c",
  "storageBucket": "jlks-paradip.firebasestorage.app",
  "apiKey": "AIzaSyBZulAyAzOJVySzxVzpAftT3xi4codPlhM",
  "authDomain": "jlks-paradip.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "168780164501"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
