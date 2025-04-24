// Auth UI Elements
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authButton = document.getElementById('authButton');
const authToggle = document.getElementById('authToggle');
const googleAuth = document.getElementById('googleAuth');
const authError = document.getElementById('authError');
const resetPassword = document.getElementById('resetPassword');

let isLoginMode = true;

// Toggle between login and signup
if (authToggle) {
    authToggle.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authButton.textContent = 'Login';
            authToggle.textContent = 'Need an account? Sign up';
            resetPassword.style.display = 'block';
        } else {
            authButton.textContent = 'Sign Up';
            authToggle.textContent = 'Already have an account? Login';
            resetPassword.style.display = 'none';
        }
    });
}

// Handle form submission
if (authForm) {
    authForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        
        if (isLoginMode) {
            loginUser(email, password);
        } else {
            signUpUser(email, password);
        }
    });
}

// Google Authentication
if (googleAuth) {
    googleAuth.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(result => {
                // Check if this is a new user
                if (result.additionalUserInfo.isNewUser) {
                    // Add user to Firestore
                    return db.collection('users').doc(result.user.uid).set({
                        email: result.user.email,
                        displayName: result.user.displayName,
                        photoURL: result.user.photoURL,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        isAdmin: false
                    });
                }
            })
            .catch(error => {
                showAuthError(error.message);
            });
    });
}

// Password Reset
if (resetPassword) {
    resetPassword.addEventListener('click', () => {
        const email = emailInput.value;
        if (!email) {
            showAuthError('Please enter your email address first');
            return;
        }
        
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
                showAuthError('Password reset email sent! Check your inbox.', 'success');
            })
            .catch(error => {
                showAuthError(error.message);
            });
    });
}

function loginUser(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            // Redirect to home page
            window.location.href = './index.html';
        })
        .catch(error => {
            showAuthError(error.message);
        });
}

function signUpUser(email, password) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(result => {
            // Add user to Firestore
            return db.collection('users').doc(result.user.uid).set({
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAdmin: false
            });
        })
        .then(() => {
            // Send verification email
            return firebase.auth().currentUser.sendEmailVerification();
        })
        .then(() => {
            showAuthError('Verification email sent! Please check your inbox.', 'success');
        })
        .catch(error => {
            showAuthError(error.message);
        });
}

function showAuthError(message, type = 'error') {
    if (!authError) return;
    
    authError.textContent = message;
    authError.style.display = 'block';
    authError.className = `auth-message ${type}`;
    
    setTimeout(() => {
        authError.style.display = 'none';
    }, 5000);
}

// Listen for auth state changes
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        if (window.location.pathname.includes('auth.html')) {
            window.location.href = './index.html';
        }
    } else {
        // User is signed out
        if (window.location.pathname.includes('profile.html') || 
            window.location.pathname.includes('admin.html')) {
            window.location.href = './auth.html';
        }
    }
});