// DOM Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeStyle = document.getElementById('darkModeStyle');
const siteLogo = document.getElementById('siteLogo');
const authLink = document.getElementById('authLink');
const adminLink = document.getElementById('adminLink');
const onlineUsersElement = document.getElementById('onlineUsers');
const totalAssetsElement = document.getElementById('totalAssets');
const totalDownloadsElement = document.getElementById('totalDownloads');

// Check for saved dark mode preference
const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';

// Apply dark mode if enabled
if (darkModeEnabled) {
    enableDarkMode();
}

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
    if (darkModeStyle.disabled) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
});

function enableDarkMode() {
    darkModeStyle.disabled = false;
    darkModeToggle.textContent = 'Light Mode';
    localStorage.setItem('darkMode', 'enabled');
    // Change logo to dark mode version if available
    if (siteLogo) {
        const logoPath = siteLogo.src;
        const darkLogoPath = logoPath.replace('.png', '-dark.png');
        // Check if dark logo exists
        const img = new Image();
        img.onload = function() {
            siteLogo.src = darkLogoPath;
        };
        img.onerror = function() {
            // Dark logo doesn't exist, keep normal one
        };
        img.src = darkLogoPath;
    }
}

function disableDarkMode() {
    darkModeStyle.disabled = true;
    darkModeToggle.textContent = 'Dark Mode';
    localStorage.setItem('darkMode', 'disabled');
    // Revert to normal logo
    if (siteLogo) {
        const logoPath = siteLogo.src;
        const normalLogoPath = logoPath.replace('-dark.png', '.png');
        siteLogo.src = normalLogoPath;
    }
}

// Initialize Firebase (config in firebase.js)
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            authLink.textContent = 'Profile';
            authLink.href = './profile.html';
            
            // Check if user is admin
            user.getIdTokenResult().then(idTokenResult => {
                if (idTokenResult.claims.admin) {
                    adminLink.style.display = 'block';
                }
            });
        } else {
            // User is signed out
            authLink.textContent = 'Login';
            authLink.href = './auth.html';
            adminLink.style.display = 'none';
        }
    });

    // Load stats
    loadStats();
    
    // Set up online users tracking
    trackOnlineUsers();
});

function loadStats() {
    const db = firebase.firestore();
    
    // Total assets
    db.collection('assets').get().then(snapshot => {
        totalAssetsElement.textContent = snapshot.size;
    });
    
    // Total downloads
    db.collection('stats').doc('downloads').get().then(doc => {
        if (doc.exists) {
            totalDownloadsElement.textContent = doc.data().count.toLocaleString();
        }
    });
}

function trackOnlineUsers() {
    const db = firebase.firestore();
    const onlineUsersRef = db.collection('stats').doc('onlineUsers');
    
    // Create a reference to the current user's online status
    const userStatusRef = db.collection('status').doc(firebase.auth().currentUser?.uid || 'anonymous');
    
    // Firestore uses a local cache, disable it for these queries
    const unsubscribe = db.collection('status')
        .where('state', '==', 'online')
        .onSnapshot(snapshot => {
            onlineUsersElement.textContent = snapshot.size;
        });
    
    // Set up presence system
    if (firebase.auth().currentUser) {
        const uid = firebase.auth().currentUser.uid;
        const userStatusDatabaseRef = firebase.database().ref('/status/' + uid);
        
        firebase.database().ref('.info/connected').on('value', function(snapshot) {
            if (snapshot.val() === false) return;
            
            userStatusDatabaseRef.onDisconnect().set({
                state: 'offline',
                last_changed: firebase.database.ServerValue.TIMESTAMP
            }).then(function() {
                userStatusDatabaseRef.set({
                    state: 'online',
                    last_changed: firebase.database.ServerValue.TIMESTAMP
                });
            });
        });
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        unsubscribe();
        if (firebase.auth().currentUser) {
            firebase.database().ref('/status/' + firebase.auth().currentUser.uid).set({
                state: 'offline',
                last_changed: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
}

// Smooth page transitions
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a:not([href^="#"])');
    
    links.forEach(link => {
        link.addEventListener('click', e => {
            if (link.href && link.href.includes(window.location.hostname)) {
                e.preventDefault();
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = link.href;
                }, 200);
            }
        });
    });
    
    document.body.style.opacity = '1';
});