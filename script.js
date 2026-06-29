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

// ================= GLOBAL THEME LISTENER =================
onValue(dbRef(db, 'youth_earners/settings/theme'), (snap) => {
    let isLight = snap.val() === 'light';
    if(isLight) document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
});

document.getElementById('adminThemeToggle').addEventListener('click', async () => {
    let isLight = document.body.classList.contains('light-theme');
    await set(dbRef(db, 'youth_earners/settings/theme'), isLight ? 'dark' : 'light');
    alert("Theme Updated for All Users!");
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


// ================= ADMIN PANEL PIN =================
let adminPin = "7878";
onValue(dbRef(db, 'youth_earners/settings/adminPin'), snap => {
    if(snap.exists()) adminPin = snap.val();
});

let tapCount = 0; let tapTimer;
document.getElementById('topSmallLogo').addEventListener('click', () => {
    tapCount++; clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { tapCount = 0; }, 2000); 
    if(tapCount === 7) {
        tapCount = 0; 
        let attempt = prompt("Enter Master Admin PIN:");
        if(attempt === adminPin) {
            appViews.forEach(v => v.classList.remove('active'));
            document.getElementById('adminView').classList.add('active');
        } else {
            alert("Incorrect PIN!");
        }
    }
});

document.getElementById('changePinBtn').addEventListener('click', () => {
    let np = document.getElementById('newAdminPin').value.trim();
    if(np) {
        set(dbRef(db, 'youth_earners/settings/adminPin'), np).then(()=> {
            alert("Admin PIN Changed successfully!");
            document.getElementById('newAdminPin').value = "";
        });
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
        
        if(referCode) {
            const codeRef = dbRef(db, `youth_earners/referrals/${referCode}`);
            const codeSnap = await get(codeRef);
            if(codeSnap.exists()) {
                const referrerUid = codeSnap.val();
                const refBalRef = dbRef(db, `youth_earners/users/${referrerUid}/balance`);
                const refBalSnap = await get(refBalRef);
                let currentRefBal = refBalSnap.exists() ? refBalSnap.val() : 0;
                await set(refBalRef, currentRefBal + 5);
                startBalance = 4;
            }
        }
        
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
            
            onValue(dbRef(db, `youth_earners/users/${user.uid}`), (snap) => {
                if(snap.exists()) {
                    let d = snap.val();
                    let bal = d.balance || 0;
                    document.getElementById('headerBal').innerText = bal;
                    document.getElementById('walletPageBal').innerText = bal;
                    document.getElementById('myReferCode').innerText = d.myCode || "No Code";
                    if(d.myCode) set(dbRef(db, `youth_earners/referrals/${d.myCode}`), user.uid);
                } else {
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

// Direct Image Upload (No Alert unless error)
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
            }).catch(e => {
                uploadStatus.style.display = 'none';
                alert("Upload Error: " + e.message);
            });
        }
    };
});

// ================= MULTIPLE BANNERS CAROUSEL =================
const bannerRef = dbRef(db, 'youth_earners/banners');
let allBanners = [];
let bannerTimer;

onValue(bannerRef, (snap) => {
    allBanners = [];
    const list = document.getElementById('adminBannerList');
    list.innerHTML = "";
    
    if(snap.exists()) {
        Object.entries(snap.val()).forEach(([id, b]) => {
            allBanners.push(b);
            list.innerHTML += `<div class="admin-req-card" style="display:flex; justify-content:space-between; align-items:center;">
                <img src="${b.imgUrl}" style="height:30px; border-radius:5px;">
                <button style="width:auto; margin:0;" onclick="deleteBanner('${id}')">Delete</button>
            </div>`;
        });
    }
    renderCarousel();
});

function renderCarousel() {
    const slide = document.getElementById('carouselSlide');
    const dots = document.getElementById('carouselDots');
    slide.innerHTML = ""; dots.innerHTML = "";
    
    if(allBanners.length === 0) {
        slide.innerHTML = `<a href="#"><img src="https://placehold.co/600x250/141414/FFD700?text=YOUTH+EARNER" alt="Promo"></a>`;
        return;
    }
    
    allBanners.forEach((b, i) => {
        slide.innerHTML += `<a href="${b.linkUrl}"><img src="${b.imgUrl}"></a>`;
        dots.innerHTML += `<span class="dot ${i===0?'active':''}"></span>`;
    });
    
    let currentIdx = 0;
    clearInterval(bannerTimer);
    bannerTimer = setInterval(() => {
        currentIdx = (currentIdx + 1) % allBanners.length;
        slide.style.transform = `translateX(-${currentIdx * 100}%)`;
        document.querySelectorAll('.dot').forEach((d, i) => {
            if(i === currentIdx) d.classList.add('active');
            else d.classList.remove('active');
        });
    }, 3000);
}

document.getElementById('addBannerBtn').addEventListener('click', () => {
    let img = document.getElementById('adminBannerImg').value;
    let link = document.getElementById('adminBannerLink').value || "#";
    if(img) {
        push(bannerRef, { imgUrl: img, linkUrl: link }).then(() => {
            document.getElementById('adminBannerImg').value = "";
            document.getElementById('adminBannerLink').value = "";
            alert("Banner Added to Slider!");
        });
    }
});

window.deleteBanner = function(id) {
    if(confirm("Remove this banner?")) remove(dbRef(db, `youth_earners/banners/${id}`));
}

// ================= MATCHES (No Categories) =================
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
        hasMatches = true;
        matchList.innerHTML += `
            <div class="match-card">
                <div class="match-info">
                    <div class="fee-box"><p>Entry Fee</p><h3>₹${match.fee}</h3></div>
                    <div class="prize-box"><p>Winning Prize</p><h3>₹${match.prize}</h3></div>
                </div>
                <div class="match-footer">
                    <button class="play-btn" onclick="openMatchDetails(${match.fee}, ${match.prize})">PLAY NOW</button>
                </div>
            </div>`;
    });
    if(!hasMatches) matchList.innerHTML = "<p class='text-center text-muted'>No battles active right now.</p>";
}

// ================= MATCHMAKING LOGIC =================
window.openMatchDetails = function(fee, prize) {
    document.getElementById('mdEntry').innerText = "₹" + fee;
    document.getElementById('mdPrize').innerText = "₹" + prize;
    document.getElementById('matchDetailsOverlay').classList.add('active');
}
document.getElementById('closeMatchDetails').addEventListener('click', () => {
    document.getElementById('matchDetailsOverlay').classList.remove('active');
});

document.getElementById('startMatchmakingBtn').addEventListener('click', () => {
    document.getElementById('matchDetailsOverlay').classList.remove('active');
    document.getElementById('matchingOverlay').classList.add('active');
    
    const strip = document.getElementById('slotStrip');
    strip.classList.remove('spin-anim');
    void strip.offsetWidth; 
    strip.classList.add('spin-anim');
    document.getElementById('matchOppName').innerText = "Searching...";
    
    setTimeout(() => {
        document.getElementById('matchOppName').innerText = "Player " + Math.floor(Math.random()*999);
        setTimeout(() => {
            alert("Match Started! Code goes to Game Screen here.");
            document.getElementById('matchingOverlay').classList.remove('active');
        }, 1500);
    }, 3000); 
});


// ================= FAKE TOAST POPUPS (DEPOSIT & WITHDRAW) =================
const fakeNames = ["Rahul", "Amit", "Priya", "Vikash", "Neha", "Rohan", "Sneha", "Karan", "Aman", "Ritu", "Faizan", "Rohit"];
setInterval(() => {
    if(document.getElementById('walletView').classList.contains('active')) {
        let isDep = document.getElementById('depositArea').style.display !== 'none';
        let name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
        let amt = isDep ? Math.floor(Math.random() * 90) + 10 : Math.floor(Math.random() * 995) + 5;
        let msg = isDep ? `🔥 ₹${amt} deposit by ${name}` : `💸 ₹${amt} withdrawn by ${name}`;
        
        let t = document.getElementById('fakeToast');
        t.innerHTML = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2500);
    }
}, 4500);


// ================= WALLET REQUESTS =================
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
document.getElementById('addMatchBtn').addEventListener('click', () => {
    let fee = parseInt(document.getElementById('adminMatchEntry').value);
    let prize = parseInt(document.getElementById('adminMatchPrize').value);
    if(!fee || !prize) return alert("Enter Fee and Prize!");
    push(dbRef(db, 'youth_earners/matches'), { fee: fee, prize: prize }).then(() => {
        document.getElementById('adminMatchEntry').value = ""; document.getElementById('adminMatchPrize').value = ""; alert("Match Posted!");
    });
});

onValue(dbRef(db, 'youth_earners/requests/deposits'), (snap) => {
    const list = document.getElementById('adminDepositList'); list.innerHTML = "";
    if(snap.exists()) {
        Object.entries(snap.val()).forEach(([reqId, req]) => {
            list.innerHTML += `<div class="admin-req-card"><p><b>${req.name}</b> requests <b>₹${req.amount}</b></p><p>UTR: ${req.utr}</p><button onclick="approveDeposit('${reqId}', '${req.uid}', ${req.amount})">Approve</button></div>`;
        });
    } else { list.innerHTML = "<p class='text-muted'>No requests</p>"; }
});

window.approveDeposit = async function(reqId, uid, amount) {
    const userBalRef = dbRef(db, `youth_earners/users/${uid}/balance`);
    const snap = await get(userBalRef);
    let bal = snap.exists() ? snap.val() : 0;
    await set(userBalRef, bal + amount);
    await remove(dbRef(db, `youth_earners/requests/deposits/${reqId}`));
    alert("Approved!");
}

onValue(dbRef(db, 'youth_earners/requests/withdrawals'), (snap) => {
    const list = document.getElementById('adminWithdrawList'); list.innerHTML = "";
    if(snap.exists()) {
        Object.entries(snap.val()).forEach(([reqId, req]) => {
            list.innerHTML += `<div class="admin-req-card" style="border-left-color: #3b82f6;"><p><b>${req.name}</b> withdraws <b>₹${req.amount}</b></p><p>${req.method.toUpperCase()}: ${req.details}</p><button onclick="approveWithdraw('${reqId}', '${req.uid}', ${req.amount})">Mark Paid & Deduct</button></div>`;
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
