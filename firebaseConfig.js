// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKkg9fQyGJl7O4XB8b9SN4v5VAmZDY9LE",
  authDomain: "clover-ddbe7.firebaseapp.com",
  databaseURL: "https://clover-ddbe7-default-rtdb.firebaseio.com",
  projectId: "clover-ddbe7",
  storageBucket: "clover-ddbe7.appspot.com",
  messagingSenderId: "958427777468",
  appId: "1:958427777468:web:3df1c7ec4dbb2f4df9c3b9",
  measurementId: "G-VTVJJYSS70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
