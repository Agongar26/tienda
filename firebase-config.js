import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCg2rgc9jMFvNntfv0s6SQgKnW_BBlsIuE",
  authDomain: "tienda-ropa-prueba.firebaseapp.com",
  projectId: "tienda-ropa-prueba",
  storageBucket: "tienda-ropa-prueba.firebasestorage.app",
  messagingSenderId: "148248364448",
  appId: "1:148248364448:web:236caf4388f167f62ad0c5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);