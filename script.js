// IMPORT FIREBASE SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGncZ4cm-VUA_zSVsaGA9znU-QJz5rbqA",
  authDomain: "kk-esports.firebaseapp.com",
  projectId: "kk-esports",
  storageBucket: "kk-esports.firebasestorage.app",
  messagingSenderId: "694738469810",
  appId: "1:694738469810:web:2a3c163cd68cbcef0a1aab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// ================= SCREEN & NAV LOGIC =================
const screens = ['splashScreen', 'authScreen', 'signupScreen', 'mainApp'];
function showScreen(screenId) {
    screens.forEach(s => document.getElementById(s).classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Bottom Nav Logic
const navItems = document.querySelectorAll('.nav-item');
const appViews = document.querySelectorAll('.app-view');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        let targetView = item.getAttribute('data-target');
        appViews.forEach(v => v.classList.remove('active'));
        document.getElementById(targetView).classList.add('active');
    });
});

// Profile Menu triggers
document.querySelectorAll('.nav-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        let target = trigger.getAttribute('data-target');
        appViews.forEach(v => v.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        // Update bottom nav active state visually
        navItems.forEach(n => n.classList.remove('active'));
        document.querySelector(`.nav-item[data-target="${target}"]`).classList.add('active');
    });
});

// ================= 7 TAP SECRET ADMIN LOGIC =================
let tapCount = 0;
let tapTimer;
document.getElementById('topSmallLogo').addEventListener('click', () => {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { tapCount = 0; }, 2000); // Reset if too slow
    
    if(tapCount === 7) {
        appViews.forEach(v => v.classList.remove('active'));
        document.getElementById('adminView').classList.add('active');
        tapCount = 0;
        alert("Welcome to Admin Panel!");
    }
});


// ================= AUTH LOGIC =================
setTimeout(() => { if (!auth.currentUser) showScreen('authScreen'); }, 3000);

document.getElementById('goToSignupBtn').addEventListener('click', () => showScreen('signupScreen'));
document.getElementById('backToLoginBtn').addEventListener('click', () => showScreen('authScreen'));

function getFakeEmail(num) { return num.trim() + "@youthearners.com"; }

document.getElementById('finalSignupBtn').addEventListener('click', () => {
    const user = document.getElementById('regUsername').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;
    if(!user || phone.length < 10 || pass.length < 6) return alert("Fill all details correctly!");
    
    createUserWithEmailAndPassword(auth, getFakeEmail(phone), pass).then((cred) => {
        updateProfile(cred.user, { displayName: user, photoURL: "https://via.placeholder.com/100" });
    }).catch(e => alert(e.message));
});

document.getElementById('loginBtn').addEventListener('click', () => {
    const phone = document.getElementById('phoneInput').value;
    const pass = document.getElementById('passInput').value;
    signInWithEmailAndPassword(auth, getFakeEmail(phone), pass).catch(e => alert("Wrong Number/Pass"));
});

document.getElementById('googleBtn').addEventListener('click', () => signInWithPopup(auth, googleProvider));
document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        showScreen('mainApp');
        document.getElementById('profileUsername').innerText = user.displayName || "Player";
        if(user.photoURL) document.getElementById('userProfilePic').src = user.photoURL;
    } else {
        showScreen('authScreen');
    }
});

// Profile Pic Change (Basic via URL prompt)
window.changeProfilePic = function() {
    let newUrl = prompt("Enter new Profile Image URL:");
    if(newUrl && auth.currentUser) {
        updateProfile(auth.currentUser, { photoURL: newUrl }).then(() => {
            document.getElementById('userProfilePic').src = newUrl;
        });
    }
}


// ================= REALTIME DATABASE (ADMIN & HOME) =================
const matchesRef = ref(db, 'youth_earners/matches');
const bannerRef = ref(db, 'youth_earners/banner');

// Load Banner Live
onValue(bannerRef, (snapshot) => {
    const data = snapshot.val();
    if(data) {
        document.getElementById('homeBanner').src = data.imgUrl;
        document.getElementById('bannerLink').href = data.linkUrl;
        
        // Populate Admin Inputs automatically
        document.getElementById('adminBannerImg').value = data.imgUrl;
        document.getElementById('adminBannerLink').value = data.linkUrl;
    }
});

// Load Matches Live (Home + Admin List)
onValue(matchesRef, (snapshot) => {
    const data = snapshot.val();
    const matchList = document.getElementById('matchList');
    const adminMatchList = document.getElementById('adminMatchList');
    
    matchList.innerHTML = "";
    adminMatchList.innerHTML = "";

    if(data) {
        // Sort matches by fee
        let matchesArr = Object.entries(data).sort((a,b) => a[1].fee - b[1].fee);
        
        matchesArr.forEach(([id, match]) => {
            // Home User View
            matchList.innerHTML += `
                <div class="match-card">
                    <div><span class="match-fee">Entry: ₹${match.fee}</span></div>
                    <button class="play-btn" onclick="alert('Matching for ₹${match.fee} started!')">PLAY NOW</button>
                </div>`;
            
            // Admin View
            adminMatchList.innerHTML += `
                <div class="match-card">
                    <span class="match-fee">₹${match.fee}</span>
                    <button onclick="deleteMatch('${id}')" style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Delete</button>
                </div>`;
        });
    } else {
        matchList.innerHTML = "<p style='color:#888; text-align:center;'>No matches added by Admin.</p>";
    }
});

// Admin Functions
document.getElementById('updateBannerBtn').addEventListener('click', () => {
    let img = document.getElementById('adminBannerImg').value;
    let link = document.getElementById('adminBannerLink').value;
    set(bannerRef, { imgUrl: img, linkUrl: link }).then(() => alert("Banner Updated!"));
});

document.getElementById('addMatchBtn').addEventListener('click', () => {
    let fee = parseInt(document.getElementById('adminMatchEntry').value);
    if(!fee || fee <= 0) return alert("Enter valid fee");
    push(matchesRef, { fee: fee }).then(() => {
        document.getElementById('adminMatchEntry').value = "";
    });
});

window.deleteMatch = function(matchId) {
    if(confirm("Delete this match?")) {
        remove(ref(db, `youth_earners/matches/${matchId}`));
    }
}
