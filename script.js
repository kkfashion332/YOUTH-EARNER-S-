// FIREBASE IMPORTS (SDK Version 10)
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

// YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCGncZ4cm-VUA_zSVsaGA9znU-QJz5rbqA",
  authDomain: "kk-esports.firebaseapp.com",
  projectId: "kk-esports",
  storageBucket: "kk-esports.firebasestorage.app",
  messagingSenderId: "694738469810",
  appId: "1:694738469810:web:2a3c163cd68cbcef0a1aab"
};

// Initialize Firebase App & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// DOM Elements for Auth
const emailInput = document.getElementById('emailInput');
const passInput = document.getElementById('passInput');
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const userNameDisplay = document.getElementById('userNameDisplay');

// 1. SIGN UP (New User)
document.getElementById('signupBtn').addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;
    if(!email || !password) return alert("Please enter email and password");

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("Account created successfully!");
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
});

// 2. LOGIN (Existing User)
document.getElementById('loginBtn').addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;
    if(!email || !password) return alert("Please enter email and password");

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Logged in!");
        })
        .catch((error) => {
            alert("Error: " + error.message);
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

// 5. MONITOR AUTH STATE (Shows/Hides screens automatically)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        loginScreen.classList.remove('active');
        appScreen.classList.add('active');
        // Set user name (Google gives displayName, Email gives email)
        userNameDisplay.innerText = user.displayName ? user.displayName.split(" ")[0] : user.email.split("@")[0];
    } else {
        // User is logged out
        appScreen.classList.remove('active');
        loginScreen.classList.add('active');
        emailInput.value = "";
        passInput.value = "";
    }
});


/* =========================================
   GAME LOGIC (YOUTH EARNER'S)
   ========================================= */
let p1Tokens = 500;
let p2Tokens = 500;
let p1Wins = 0;
let p2Wins = 0;
let currentRound = 1;
const totalRounds = 3; 

// Attach functions to window object because we are using a JS Module type now
window.startGame = function(amount) {
    p1Tokens = 500; p2Tokens = 500; p1Wins = 0; p2Wins = 0; currentRound = 1;
    updateUI();
    document.getElementById('roundResult').innerText = "";
    document.getElementById('bidInput').value = "";
    document.getElementById('lobbyView').classList.remove('active');
    document.getElementById('gameView').classList.add('active');
}

window.showLobby = function() {
    document.getElementById('gameView').classList.remove('active');
    document.getElementById('lobbyView').classList.add('active');
}

window.lockBid = function() {
    let bidInput = document.getElementById('bidInput').value;
    let p1Bid = parseInt(bidInput);

    if (isNaN(p1Bid) || p1Bid <= 0) return alert("Please enter a valid amount!");
    if (p1Bid > p1Tokens) return alert("You don't have enough tokens!");

    // Bot Logic
    let p2Bid = Math.floor(Math.random() * p2Tokens) + 1;

    p1Tokens -= p1Bid; p2Tokens -= p2Bid;
    let resultText = `You bid ${p1Bid}, Opponent bid ${p2Bid}.<br>`;
    
    if (p1Bid > p2Bid) { p1Wins++; resultText += "<span style='color:#10b981'>You WON this round! 🎉</span>"; } 
    else if (p2Bid > p1Bid) { p2Wins++; resultText += "<span style='color:#ef4444'>Opponent WON this round! 😞</span>"; } 
    else { resultText += "<span style='color:#f59e0b'>Round TIE! 🤝</span>"; }

    document.getElementById('roundResult').innerHTML = resultText;
    currentRound++;
    updateUI();
    document.getElementById('bidInput').value = "";

    setTimeout(() => {
        if (currentRound > totalRounds || p1Tokens === 0 || p2Tokens === 0) {
            let finalMsg = p1Wins > p2Wins ? "Congratulations! You won! 🏆" : (p2Wins > p1Wins ? "You lost! 💔" : "Draw! ⚖️");
            alert("Game Over!\n\n" + finalMsg);
            window.showLobby();
        }
    }, 500);
}

function updateUI() {
    document.getElementById('p1Tokens').innerText = p1Tokens;
    document.getElementById('p2Tokens').innerText = p2Tokens;
    document.getElementById('p1Score').innerText = p1Wins;
    document.getElementById('p2Score').innerText = p2Wins;
    if(currentRound <= totalRounds) document.getElementById('roundCount').innerText = currentRound;
}

