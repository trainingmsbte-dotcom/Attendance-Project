// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCa3XebDoLBI8yTh4htQpkZo2HZUoBM2iY",
  authDomain: "esp8266-attendance.firebaseapp.com",
  projectId: "esp8266-attendance",
  storageBucket: "esp8266-attendance.appspot.com",
  messagingSenderId: "850283209001",
  appId: "1:850283209001:web:c9785987fdf6a2eae09738"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const db = getFirestore(app);

export { app, db };
