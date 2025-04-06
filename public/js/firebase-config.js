import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDacxZEcFUQGZ7OYCk3oqx17pyNkszHt1s",
    authDomain: "verify-voter-463e8.firebaseapp.com",
    databaseURL: "https://verify-voter-463e8-default-rtdb.firebaseio.com",
    projectId: "verify-voter-463e8",
    storageBucket: "verify-voter-463e8.firebasestorage.app",
    messagingSenderId: "1077979523648",
    appId: "1:1077979523648:web:f09b3a2902b85e9d898da5",
    measurementId: "G-0VSKL7M2D9"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);