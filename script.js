// Import Firebase SDKs (Added updateProfile to save Username)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    updateProfile,
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
const signupScreen = document.getElementById('signupScreen');
const mainApp = document.getElementById('mainApp');

// Login Elements
const phoneInput = document.getElementById('phoneInput');
const passInput = document.getElementById('passInput');

// Registration Elements
const regUsername = document.getElementById('regUsername');
const regPhone = document.getElementById('regPhone');
const regPass = document.getElementById('regPass');

// ================= SPLASH SCREEN LOGIC =================
setTimeout(() => {
    if (!auth.currentUser) {
        splashScreen.classList.remove('active');
        authScreen.classList.add('active');
    }
}, 3500);

// ================= SCREEN SWITCHING =================
// Login to Sign Up Page
document.getElementById('goToSignupBtn').addEventListener('click', () => {
    authScreen.classList.remove('active');
    signupScreen.classList.add('active');
});

// Sign Up to Login Page
document.getElementById('backToLoginBtn').addEventListener('click', () => {
    signupScreen.classList.remove('active');
    authScreen.classList.add('active');
});


// ================= HELPER FUNCTION =================
function getFakeEmail(number) {
    return number.trim() + "@youthearners.com";
}

// ================= AUTHENTICATION LOGIC =================

// 1. FINAL SIGN UP (Create Account with Username)
document.getElementById('finalSignupBtn').addEventListener('click', () => {
    const username = regUsername.value;
    const phone = regPhone.value;
    const password = regPass.value;

    if (!username) return alert("Please enter a username.");
    if (phone.length < 10) return alert("Please enter a valid 10-digit mobile number.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");

    const fakeEmail = getFakeEmail(phone);

    // Create User in Firebase
    createUserWithEmailAndPassword(auth, fakeEmail, password)
        .then((userCredential) => {
            // Account created! Now save the username
            updateProfile(userCredential.user, {
                displayName: username
            }).then(() => {
                alert("Account created successfully! Welcome " + username);
                // onAuthStateChanged trigger hoga aur apne aap main app me le jayega
            });
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
        // Hide all login/signup screens
        splashScreen.classList.remove('active');
        authScreen.classList.remove('active');
        signupScreen.classList.remove('active');
        
        // Show Main App
        mainApp.classList.add('active');

        // Show Name
        let displayName = user.displayName || "Player";
        document.getElementById('displayUserName').innerText = "Hello, " + displayName;
    } else {
        // User logged out
        mainApp.classList.remove('active');
        phoneInput.value = "";
        passInput.value = "";
        regUsername.value = "";
        regPhone.value = "";
        regPass.value = "";
    }
});
