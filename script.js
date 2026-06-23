// IMPORT FIREBASE SDKs (Added Storage for Gallery Upload)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref as dbRef, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGncZ4cm-VUA_zSVsaGA9znU-QJz5rbqA",
  authDomain: "kk-esports.firebaseapp.com",
  databaseURL: "https://kk-esports-default-rtdb.firebaseio.com", 
  projectId: "kk-esports",
  storageBucket: "kk-esports.firebasestorage.app",
  messagingSenderId: "694738469810",
  appId: "1:694738469810:web:2a3c163cd68cbcef0a1aab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app); // Storage Init
const googleProvider = new GoogleAuthProvider();

// ================= NAVIGATION LOGIC =================
const screens = ['splashScreen', 'authScreen', 'signupScreen', 'mainApp'];
function showScreen(screenId) {
    screens.forEach(s => document.getElementById(s).classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

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

document.querySelectorAll('.nav-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        let target = trigger.getAttribute('data-target');
        appViews.forEach(v => v.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        navItems.forEach(n => n.classList.remove('active'));
        document.querySelector(`.nav-item[data-target="${target}"]`).classList.add('active');
    });
});

// ================= ADMIN PANEL (7 TAPS) =================
let tapCount = 0; let tapTimer;
document.getElementById('topSmallLogo').addEventListener('click', () => {
    tapCount++; clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { tapCount = 0; }, 2000); 
    if(tapCount === 7) {
        appViews.forEach(v => v.classList.remove('active'));
        document.getElementById('adminView').classList.add('active');
        tapCount = 0; alert("Welcome Boss! Admin Panel Unlocked.");
    }
});

// ================= AUTHENTICATION =================
document.getElementById('goToSignupBtn').addEventListener('click', () => showScreen('signupScreen'));
document.getElementById('backToLoginBtn').addEventListener('click', () => showScreen('authScreen'));
function getFakeEmail(num) { return num.trim() + "@youthearners.com"; }

document.getElementById('finalSignupBtn').addEventListener('click', () => {
    const user = document.getElementById('regUsername').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;
    if(!user || phone.length < 10 || pass.length < 6) return alert("Fill correctly (Phone 10 digits, Pass 6 chars)");
    
    createUserWithEmailAndPassword(auth, getFakeEmail(phone), pass).then((cred) => {
        updateProfile(cred.user, { displayName: user, photoURL: "https://placehold.co/150" });
    }).catch(e => alert(e.message));
});

document.getElementById('loginBtn').addEventListener('click', () => {
    const phone = document.getElementById('phoneInput').value;
    const pass = document.getElementById('passInput').value;
    signInWithEmailAndPassword(auth, getFakeEmail(phone), pass).catch(e => alert("Invalid Credentials"));
});

['googleBtn', 'googleSignupBtn'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => signInWithPopup(auth, googleProvider));
});
document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

// ================= INIT APP & LOAD USER DATA =================
let isInitialLoad = true;
onAuthStateChanged(auth, (user) => {
    if (user) {
        setTimeout(() => {
            showScreen('mainApp');
            // Populate Profile Data
            document.getElementById('profileUsernameInput').value = user.displayName || "Player";
            document.getElementById('profilePhoneDisplay').innerText = user.email ? user.email.replace('@youthearners.com', '') : "Google User";
            if(user.photoURL) document.getElementById('userProfilePic').src = user.photoURL;
            isInitialLoad = false;
        }, isInitialLoad ? 3500 : 0); 
    } else {
        setTimeout(() => { showScreen('authScreen'); isInitialLoad = false; }, isInitialLoad ? 3500 : 0);
    }
});

// ================= PROFILE: EDIT NAME & GALLERY UPLOAD =================
// 1. Edit Name Logic
const nameInput = document.getElementById('profileUsernameInput');
const editBtn = document.getElementById('editNameBtn');
const saveBtn = document.getElementById('saveNameBtn');

editBtn.addEventListener('click', () => {
    nameInput.disabled = false;
    nameInput.focus();
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
});

saveBtn.addEventListener('click', () => {
    let newName = nameInput.value.trim();
    if(newName && auth.currentUser) {
        updateProfile(auth.currentUser, { displayName: newName }).then(() => {
            nameInput.disabled = true;
            saveBtn.style.display = 'none';
            editBtn.style.display = 'inline-block';
            alert("Name updated successfully!");
        });
    }
});

// 2. Gallery Upload Logic (Firebase Storage)
const avatarClicker = document.getElementById('avatarClicker');
const imageUploadInput = document.getElementById('imageUploadInput');
const uploadStatus = document.getElementById('uploadStatus');

avatarClicker.addEventListener('click', () => imageUploadInput.click());

imageUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    if(!auth.currentUser) return alert("Please login first");

    uploadStatus.style.display = 'block';
    
    // Create reference in storage: avatars/user_uid
    const imgStorageRef = storageRef(storage, `avatars/${auth.currentUser.uid}`);
    
    try {
        await uploadBytes(imgStorageRef, file);
        const downloadURL = await getDownloadURL(imgStorageRef);
        
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
        document.getElementById('userProfilePic').src = downloadURL;
        alert("Profile picture updated!");
    } catch (error) {
        alert("Upload failed. (Make sure Firebase Storage rules are public/auth)");
        console.error(error);
    } finally {
        uploadStatus.style.display = 'none';
    }
});


// ================= REALTIME DATABASE (MATCHES & BANNER) =================
const matchesRef = dbRef(db, 'youth_earners/matches');
const bannerRef = dbRef(db, 'youth_earners/banner');

// Load Banner Live
onValue(bannerRef, (snapshot) => {
    const data = snapshot.val();
    if(data && data.imgUrl) {
        document.getElementById('homeBanner').src = data.imgUrl;
        document.getElementById('bannerLink').href = data.linkUrl;
    }
});

// Load Matches Live (With Detailed Info)
onValue(matchesRef, (snapshot) => {
    const data = snapshot.val();
    const matchList = document.getElementById('matchList');
    const adminMatchList = document.getElementById('adminMatchList');
    matchList.innerHTML = ""; adminMatchList.innerHTML = "";

    if(data) {
        let matchesArr = Object.entries(data).sort((a,b) => a[1].fee - b[1].fee);
        matchesArr.forEach(([id, match]) => {
            // Player View (Advanced Card)
            matchList.innerHTML += `
                <div class="match-card">
                    <div class="match-info">
                        <div class="fee-box"><p>Entry Fee</p><h3>₹${match.fee}</h3></div>
                        <div class="prize-box"><p>Winning Prize</p><h3>₹${match.prize}</h3></div>
                    </div>
                    <div class="match-footer">
                        <span class="player-type"><i class="fas fa-user-friends"></i> 1 VS 1 Battle</span>
                        <button class="play-btn" onclick="alert('Joining Match for ₹${match.fee}...')">PLAY NOW</button>
                    </div>
                </div>`;
            
            // Admin View
            adminMatchList.innerHTML += `
                <div style="background:#222; padding:10px; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span>Fee: ₹${match.fee} | Win: ₹${match.prize}</span>
                    <button onclick="deleteMatch('${id}')" style="background:var(--danger); color:#fff; border:none; padding:5px 15px; border-radius:5px; cursor:pointer;">Delete</button>
                </div>`;
        });
    } else {
        matchList.innerHTML = "<p class='text-center text-muted'>No active battles right now.</p>";
    }
});

// Admin Post Functions
document.getElementById('addMatchBtn').addEventListener('click', () => {
    let fee = parseInt(document.getElementById('adminMatchEntry').value);
    let prize = parseInt(document.getElementById('adminMatchPrize').value);
    
    if(!fee || !prize) return alert("Enter both Fee and Prize amount!");
    
    push(matchesRef, { fee: fee, prize: prize })
    .then(() => {
        document.getElementById('adminMatchEntry').value = "";
        document.getElementById('adminMatchPrize').value = "";
        alert("Match Posted Live!");
    });
});

window.deleteMatch = function(matchId) {
    if(confirm("Remove this match?")) remove(dbRef(db, `youth_earners/matches/${matchId}`));
}
