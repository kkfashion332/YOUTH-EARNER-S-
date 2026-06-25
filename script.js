import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref as dbRef, set, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const googleProvider = new GoogleAuthProvider();

// ================= THEME TOGGLE =================
document.getElementById('themeToggleBtn').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

// ================= NAVIGATION =================
const screens = ['splashScreen', 'authScreen', 'signupScreen', 'mainApp', 'matchDetailsOverlay', 'matchingOverlay'];
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

// Wallet Tabs
document.getElementById('tabDeposit').addEventListener('click', (e) => {
    e.target.classList.add('active'); document.getElementById('tabWithdraw').classList.remove('active');
    document.getElementById('depositArea').style.display = 'block'; document.getElementById('withdrawArea').style.display = 'none';
});
document.getElementById('tabWithdraw').addEventListener('click', (e) => {
    e.target.classList.add('active'); document.getElementById('tabDeposit').classList.remove('active');
    document.getElementById('withdrawArea').style.display = 'block'; document.getElementById('depositArea').style.display = 'none';
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

// ================= AUTHENTICATION & REFERRAL =================
document.getElementById('goToSignupBtn').addEventListener('click', () => showScreen('signupScreen'));
document.getElementById('backToLoginBtn').addEventListener('click', () => showScreen('authScreen'));
function getFakeEmail(num) { return num.trim() + "@youthearners.com"; }

document.getElementById('finalSignupBtn').addEventListener('click', async () => {
    const user = document.getElementById('regUsername').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;
    const referCode = document.getElementById('regReferCode').value.trim();
    
    if(!user || phone.length < 10 || pass.length < 6) return alert("Fill correctly!");
    const defaultPic = "https://ui-avatars.com/api/?name=" + user + "&background=FFD700&color=000&size=150";

    try {
        const cred = await createUserWithEmailAndPassword(auth, getFakeEmail(phone), pass);
        await updateProfile(cred.user, { displayName: user, photoURL: defaultPic });
        
        let startBalance = 0;
        
        // Referral Logic
        if(referCode) {
            const codeRef = dbRef(db, `youth_earners/referrals/${referCode}`);
            const codeSnap = await get(codeRef);
            if(codeSnap.exists()) {
                const referrerUid = codeSnap.val();
                // Add Rs 5 to referrer
                const refBalRef = dbRef(db, `youth_earners/users/${referrerUid}/balance`);
                const refBalSnap = await get(refBalRef);
                let currentRefBal = refBalSnap.exists() ? refBalSnap.val() : 0;
                await set(refBalRef, currentRefBal + 5);
                startBalance = 4; // New user gets Rs 4
            }
        }
        
        // Setup User Node
        await set(dbRef(db, `youth_earners/users/${cred.user.uid}`), {
            balance: startBalance,
            phone: phone,
            myCode: "YE-" + Math.floor(10000 + Math.random() * 90000)
        });
        
    } catch(e) { alert(e.message); }
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

// ================= INIT APP =================
let isInitialLoad = true;
let currentUserObj = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserObj = user;
        setTimeout(() => {
            showScreen('mainApp');
            document.getElementById('profileUsernameInput').value = user.displayName || "Player";
            document.getElementById('profilePhoneDisplay').innerText = user.email ? user.email.replace('@youthearners.com', '') : "Google User";
            document.getElementById('userProfilePic').src = user.photoURL || "https://ui-avatars.com/api/?name=Player&background=FFD700";
            document.getElementById('matchMyPic').src = user.photoURL || "https://ui-avatars.com/api/?name=Player&background=FFD700";
            document.getElementById('matchMyName').innerText = user.displayName || "Player";
            
            // Listen to Balance & Code
            onValue(dbRef(db, `youth_earners/users/${user.uid}`), (snap) => {
                if(snap.exists()) {
                    let d = snap.val();
                    let bal = d.balance || 0;
                    document.getElementById('headerBal').innerText = bal;
                    document.getElementById('walletPageBal').innerText = bal;
                    document.getElementById('myReferCode').innerText = d.myCode || "No Code";
                    
                    // Save my code to referrals list
                    if(d.myCode) set(dbRef(db, `youth_earners/referrals/${d.myCode}`), user.uid);
                } else {
                    // Create if Google Login
                    let newCode = "YE-" + Math.floor(10000 + Math.random() * 90000);
                    set(dbRef(db, `youth_earners/users/${user.uid}`), { balance: 0, myCode: newCode });
                }
            });
            isInitialLoad = false;
        }, isInitialLoad ? 2000 : 0); 
    } else {
        setTimeout(() => { showScreen('authScreen'); isInitialLoad = false; }, isInitialLoad ? 2000 : 0);
    }
});

// Profile Editing
const nameInput = document.getElementById('profileUsernameInput');
const editBtn = document.getElementById('editNameBtn');
const saveBtn = document.getElementById('saveNameBtn');

editBtn.addEventListener('click', () => { nameInput.disabled = false; nameInput.focus(); editBtn.style.display = 'none'; saveBtn.style.display = 'inline-block'; });
saveBtn.addEventListener('click', () => {
    if(nameInput.value.trim() && auth.currentUser) {
        updateProfile(auth.currentUser, { displayName: nameInput.value.trim() }).then(() => {
            nameInput.disabled = true; saveBtn.style.display = 'none'; editBtn.style.display = 'inline-block'; alert("Name updated!");
        });
    }
});

const avatarClicker = document.getElementById('avatarClicker');
const imageUploadInput = document.getElementById('imageUploadInput');
const uploadStatus = document.getElementById('uploadStatus');

avatarClicker.addEventListener('click', () => imageUploadInput.click());
imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file || !auth.currentUser) return;
    uploadStatus.style.display = 'block';
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
        const img = new Image(); img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
            canvas.width = 150; canvas.height = 150; ctx.drawImage(img, 0, 0, 150, 150);
            const base64String = canvas.toDataURL('image/jpeg', 0.6); 
            updateProfile(auth.currentUser, { photoURL: base64String }).then(() => {
                document.getElementById('userProfilePic').src = base64String;
                document.getElementById('matchMyPic').src = base64String;
                uploadStatus.style.display = 'none';
                alert("Profile picture updated!");
            });
        }
    };
});

// ================= DATABASE (BANNER, MATCHES, CATEGORIES) =================
const bannerRef = dbRef(db, 'youth_earners/banner');
onValue(bannerRef, (snap) => {
    if(snap.exists() && snap.val().imgUrl) {
        document.getElementById('homeBanner').src = snap.val().imgUrl;
        document.getElementById('bannerLink').href = snap.val().linkUrl || "#";
    }
});

let currentCategory = "1v1";
const catBtns = document.querySelectorAll('.cat-btn');
catBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        catBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-cat');
        renderMatches();
    });
});

let allMatches = {};
onValue(dbRef(db, 'youth_earners/matches'), (snap) => {
    allMatches = snap.exists() ? snap.val() : {};
    renderMatches();
});

function renderMatches() {
    const matchList = document.getElementById('matchList');
    matchList.innerHTML = "";
    let hasMatches = false;
    
    Object.entries(allMatches).sort((a,b) => a[1].fee - b[1].fee).forEach(([id, match]) => {
        if(match.cat === currentCategory) {
            hasMatches = true;
            matchList.innerHTML += `
                <div class="match-card">
                    <div class="match-info">
                        <div class="fee-box"><p>Entry Fee</p><h3>₹${match.fee}</h3></div>
                        <div class="prize-box"><p>Winning Prize</p><h3>₹${match.prize}</h3></div>
                    </div>
                    <div class="match-footer">
                        <span class="player-type"><i class="fas fa-users"></i> ${match.cat.toUpperCase()} Battle</span>
                        <button class="play-btn" onclick="openMatchDetails(${match.fee}, ${match.prize}, '${match.cat}')">PLAY NOW</button>
                    </div>
                </div>`;
        }
    });
    if(!hasMatches) matchList.innerHTML = "<p class='text-center text-muted'>No battles in this category.</p>";
}

// ================= MATCHMAKING LOGIC (WINZO STYLE) =================
window.openMatchDetails = function(fee, prize, cat) {
    document.getElementById('mdEntry').innerText = "₹" + fee;
    document.getElementById('mdPrize').innerText = "₹" + prize;
    document.getElementById('mdCat').innerText = cat.toUpperCase() + " BATTLE";
    document.getElementById('matchDetailsOverlay').classList.add('active');
}
document.getElementById('closeMatchDetails').addEventListener('click', () => {
    document.getElementById('matchDetailsOverlay').classList.remove('active');
});

document.getElementById('startMatchmakingBtn').addEventListener('click', () => {
    document.getElementById('matchDetailsOverlay').classList.remove('active');
    document.getElementById('matchingOverlay').classList.add('active');
    
    // Start Slot Animation
    const strip = document.getElementById('slotStrip');
    strip.classList.remove('spin-anim');
    void strip.offsetWidth; // trigger reflow
    strip.classList.add('spin-anim');
    document.getElementById('matchOppName').innerText = "Searching...";
    
    setTimeout(() => {
        document.getElementById('matchOppName').innerText = "Player " + Math.floor(Math.random()*999);
        setTimeout(() => {
            alert("Match Started! Code goes to Game Screen here.");
            document.getElementById('matchingOverlay').classList.remove('active');
        }, 1500);
    }, 3000); // 3 seconds matching time
});


// ================= WALLET REQUESTS (DEPOSIT / WITHDRAW) =================
document.getElementById('submitDepositBtn').addEventListener('click', () => {
    let amt = parseInt(document.getElementById('depAmount').value);
    let utr = document.getElementById('depUtr').value.trim();
    if(!amt || !utr || utr.length < 10) return alert("Enter valid Amount and UTR Number.");
    
    push(dbRef(db, 'youth_earners/requests/deposits'), {
        uid: currentUserObj.uid, name: currentUserObj.displayName, amount: amt, utr: utr, time: new Date().toLocaleString()
    }).then(() => {
        alert("Deposit Request Sent to Admin!");
        document.getElementById('depAmount').value = ""; document.getElementById('depUtr').value = "";
    });
});

document.getElementById('submitWithdrawBtn').addEventListener('click', async () => {
    let amt = parseInt(document.getElementById('withAmount').value);
    let method = document.getElementById('withMethod').value;
    let details = document.getElementById('withDetails').value.trim();
    
    if(!amt || !details) return alert("Fill all details.");
    
    // Check balance
    const balSnap = await get(dbRef(db, `youth_earners/users/${currentUserObj.uid}/balance`));
    let currentBal = balSnap.exists() ? balSnap.val() : 0;
    if(currentBal < amt) return alert("Insufficient Balance!");
    
    push(dbRef(db, 'youth_earners/requests/withdrawals'), {
        uid: currentUserObj.uid, name: currentUserObj.displayName, amount: amt, method: method, details: details, time: new Date().toLocaleString()
    }).then(() => {
        alert("Withdrawal Request Sent!");
        document.getElementById('withAmount').value = ""; document.getElementById('withDetails').value = "";
    });
});


// ================= ADMIN ACTIONS =================
document.getElementById('updateBannerBtn').addEventListener('click', () => {
    let img = document.getElementById('adminBannerImg').value;
    let link = document.getElementById('adminBannerLink').value;
    set(bannerRef, { imgUrl: img, linkUrl: link }).then(() => alert("Banner Live!"));
});

document.getElementById('addMatchBtn').addEventListener('click', () => {
    let cat = document.getElementById('adminMatchCat').value;
    let fee = parseInt(document.getElementById('adminMatchEntry').value);
    let prize = parseInt(document.getElementById('adminMatchPrize').value);
    if(!fee || !prize) return alert("Enter Fee and Prize!");
    push(dbRef(db, 'youth_earners/matches'), { cat: cat, fee: fee, prize: prize }).then(() => {
        document.getElementById('adminMatchEntry').value = ""; document.getElementById('adminMatchPrize').value = ""; alert("Match Posted!");
    });
});

// Admin Approval Views
onValue(dbRef(db, 'youth_earners/requests/deposits'), (snap) => {
    const list = document.getElementById('adminDepositList');
    list.innerHTML = "";
    if(snap.exists()) {
        Object.entries(snap.val()).forEach(([reqId, req]) => {
            list.innerHTML += `
            <div class="admin-req-card">
                <p><b>${req.name}</b> requests <b>₹${req.amount}</b></p>
                <p>UTR: ${req.utr}</p>
                <button onclick="approveDeposit('${reqId}', '${req.uid}', ${req.amount})">Approve</button>
            </div>`;
        });
    } else { list.innerHTML = "<p class='text-muted'>No requests</p>"; }
});

window.approveDeposit = async function(reqId, uid, amount) {
    const userBalRef = dbRef(db, `youth_earners/users/${uid}/balance`);
    const snap = await get(userBalRef);
    let bal = snap.exists() ? snap.val() : 0;
    await set(userBalRef, bal + amount);
    await remove(dbRef(db, `youth_earners/requests/deposits/${reqId}`));
    alert("Approved & Added to User Wallet!");
}

onValue(dbRef(db, 'youth_earners/requests/withdrawals'), (snap) => {
    const list = document.getElementById('adminWithdrawList');
    list.innerHTML = "";
    if(snap.exists()) {
        Object.entries(snap.val()).forEach(([reqId, req]) => {
            list.innerHTML += `
            <div class="admin-req-card" style="border-left-color: #3b82f6;">
                <p><b>${req.name}</b> withdraws <b>₹${req.amount}</b></p>
                <p>${req.method.toUpperCase()}: ${req.details}</p>
                <button onclick="approveWithdraw('${reqId}', '${req.uid}', ${req.amount})">Mark Paid & Deduct</button>
            </div>`;
        });
    } else { list.innerHTML = "<p class='text-muted'>No requests</p>"; }
});

window.approveWithdraw = async function(reqId, uid, amount) {
    const userBalRef = dbRef(db, `youth_earners/users/${uid}/balance`);
    const snap = await get(userBalRef);
    let bal = snap.exists() ? snap.val() : 0;
    if(bal >= amount) {
        await set(userBalRef, bal - amount);
        await remove(dbRef(db, `youth_earners/requests/withdrawals/${reqId}`));
        alert("Deducted & Marked Paid!");
    } else {
        alert("User doesn't have enough balance anymore!");
        await remove(dbRef(db, `youth_earners/requests/withdrawals/${reqId}`));
    }
}
