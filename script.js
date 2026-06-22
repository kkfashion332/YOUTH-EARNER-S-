// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGncZ4cm-VUA_zSVsaGA9znU-QJz5rbqA",
  authDomain: "kk-esports.firebaseapp.com",
  projectId: "kk-esports",
  storageBucket: "kk-esports.firebasestorage.app",
  messagingSenderId: "694738469810",
  appId: "1:694738469810:web:2a3c163cd68cbcef0a1aab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// DOM Elements
const splashScreen = document.getElementById('splashScreen');
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const phoneInput = document.getElementById('phoneInput');
const passInput = document.getElementById('passInput');

// ================= SPLASH SCREEN LOGIC =================
// 3.5 seconds ke baad Splash Screen hide hogi aur Auth screen aayegi
setTimeout(() => {
    // Agar user logged in nahi hai, tabhi Auth screen dikhao
    if (!auth.currentUser) {
        splashScreen.classList.remove('active');
        authScreen.classList.add('active');
    }
}, 3500);

// ================= HELPER FUNCTION =================
// Yeh function Number ko ek fake email me convert karega (e.g., 9876543210@youthearners.com)
function getFakeEmail(number) {
    return number.trim() + "@youthearners.com";
}

// ================= AUTHENTICATION LOGIC =================

// 1. SIGN UP (Create Account)
document.getElementById('signupBtn').addEventListener('click', () => {
    const phone = phoneInput.value;
    const password = passInput.value;

    if (phone.length < 10) return alert("Please enter a valid 10-digit mobile number.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");

    const fakeEmail = getFakeEmail(phone);

    createUserWithEmailAndPassword(auth, fakeEmail, password)
        .then((userCredential) => {
            alert("Account created successfully! Welcome to Youth Earner's.");
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
});

// 2. LOGIN
document.getElementById('loginBtn').addEventListener('click', () => {
    const phone = phoneInput.value;
    const password = passInput.value;

    if (!phone || !password) return alert("Please enter both number and password.");

    const fakeEmail = getFakeEmail(phone);

    signInWithEmailAndPassword(auth, fakeEmail, password)
        .then((userCredential) => {
            console.log("Logged in successfully");
        })
        .catch((error) => {
            alert("Invalid Number or Password.");
        });
});

// 3. GOOGLE LOGIN
document.getElementById('googleBtn').addEventListener('click', () => {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            console.log("Google Login Success!");
        }).catch((error) => {
            alert("Google Login Error: " + error.message);
        });
});

// 4. LOGOUT
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Logged out");
    });
});

// 5. MONITOR AUTH STATE (Screen Switcher)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in -> Show Main App, Hide others
        splashScreen.classList.remove('active');
        authScreen.classList.remove('active');
        mainApp.classList.add('active');
    } else {
        // User is logged out 
        // Note: Splash screen will automatically show Auth screen after 3.5s if logged out
        mainApp.classList.remove('active');
        phoneInput.value = "";
        passInput.value = "";
    }
});
