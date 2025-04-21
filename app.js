// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCKlZo-Q0V6VzsE48deP0eECea3dO6GrBc",
    authDomain: "eyoels-hub.firebaseapp.com",
    projectId: "eyoels-hub",
    storageBucket: "eyoels-hub.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// DOM Elements
const mainContent = document.getElementById('mainContent');
const authBtn = document.getElementById('authBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileNavLinks = document.getElementById('mobileNavLinks');

// State Management
let currentUser = null;

// Owner Configuration
const OWNER_EMAIL = "your-email@domain.com"; // Set your owner email
const PREMIUM_ASSETS = [
  {
    id: "premium1",
    title: "Epic Fantasy Texture Pack",
    description: "High-resolution PBR textures for RPG games",
    category: "textures",
    url: "https://example.com/premium1.zip", // Your direct download link
    size: "18.4MB",
    thumb: "https://example.com/premium1-thumb.jpg" // Thumbnail URL
  },
  {
    id: "premium2",
    title: "Sci-Fi UI Kit",
    description: "Complete HUD elements for futuristic games",
    category: "ui",
    url: "https://example.com/premium2.zip",
    size: "9.2MB",
    thumb: "https://example.com/premium2-thumb.jpg"
  },
  // Add more premium assets as needed
];
// ======================
// AUTHENTICATION SYSTEM
// ======================
auth.onAuthStateChanged(user => {
    currentUser = user;
    updateNavigation();
    handleRouting();
});

function updateNavigation() {
    if (currentUser) {
        // Desktop Nav
        authBtn.innerHTML = 'Logout';
        authBtn.onclick = () => auth.signOut();

        // Mobile Nav
        mobileNavLinks.innerHTML = `
            <a href="#home" class="nav-link-mobile active"><i class="fas fa-home mr-2"></i> Home</a>
            <a href="#upload" class="nav-link-mobile"><i class="fas fa-upload mr-2"></i> Upload</a>
            <a href="#community" class="nav-link-mobile"><i class="fas fa-users mr-2"></i> Community</a>
            <a href="#profile" class="nav-link-mobile"><i class="fas fa-user mr-2"></i> Profile</a>
            <button onclick="auth.signOut()" class="nav-link-mobile text-red-400">
                <i class="fas fa-sign-out-alt mr-2"></i> Logout
            </button>
        `;
    } else {
        // Desktop Nav
        authBtn.innerHTML = 'Login';
        authBtn.onclick = () => (window.location.hash = '#login');

        // Mobile Nav
        mobileNavLinks.innerHTML = `
            <a href="#home" class="nav-link-mobile active"><i class="fas fa-home mr-2"></i> Home</a>
            <a href="#community" class="nav-link-mobile"><i class="fas fa-users mr-2"></i> Community</a>
            <button onclick="window.location.hash='#login'" class="nav-link-mobile text-purple-400">
                <i class="fas fa-sign-in-alt mr-2"></i> Login
            </button>
        `;
    }
}

// ======================
// ROUTING SYSTEM
// ======================
function handleRouting() {
    const hash = window.location.hash || '#home';
    
    // Close mobile menu
    mobileMenu.classList.add('hidden');
    
    switch(hash) {
        case '#home':
            showHomePage();
            break;
        case '#upload':
            showUploadPage();
            break;
        case '#community':
            showCommunityPage();
            break;
        case '#profile':
            showProfilePage();
            break;
        case '#login':
            showAuthModal('login');
            break;
        case '#signup':
            showAuthModal('signup');
            break;
        default:
            if (hash.startsWith('#asset=')) {
                showAssetPage(hash.split('=')[1]);
            } else {
                showHomePage();
            }
    }
}

window.addEventListener('hashchange', handleRouting);

// ======================
// PAGE TEMPLATES
// ======================

function showHomePage() {
    mainContent.innerHTML = `
        <div class="page-content">
            <section class="hero bg-gradient-to-r from-purple-900 to-gray-800 rounded-xl p-8 mb-8 text-center">
                <h1 class="text-4xl font-bold mb-4">Welcome to Eyoel's Hub</h1>
                <p class="text-xl mb-6">The premier platform for game asset sharing</p>
                ${!currentUser ? `
                    <div class="flex justify-center space-x-4">
                        <a href="#signup" class="btn-primary">Join Now</a>
                        <a href="#login" class="btn-secondary">Login</a>
                    </div>
                ` : `
                    <a href="#upload" class="btn-primary inline-block">Upload Your First Asset</a>
                `}
            </section>
            
            <h2 class="text-2xl font-bold mb-6">Featured Assets</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="featuredAssets">
                <!-- Assets will load here -->
            </div>
        </div>
    `;
    loadFeaturedAssets();
}

function showUploadPage() {
    if (!currentUser) {
        window.location.hash = '#login';
        return;
    }

    mainContent.innerHTML = `
        <div class="page-content max-w-3xl mx-auto">
            <h2 class="text-2xl font-bold mb-6"><i class="fas fa-upload mr-2"></i> Upload Asset</h2>
            
            <div class="upload-container bg-gray-800 rounded-xl p-6">
                <form id="uploadForm">
                    <div class="mb-4">
                        <label class="block mb-2 font-medium">Title *</label>
                        <input type="text" id="assetTitle" required class="w-full input-field">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block mb-2 font-medium">Description</label>
                        <textarea id="assetDescription" rows="3" class="w-full input-field"></textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block mb-2 font-medium">Category *</label>
                        <select id="assetCategory" required class="w-full input-field">
                            <option value="">Select category</option>
                            <option value="textures">Textures</option>
                            <option value="3d-models">3D Models</option>
                            <option value="audio">Audio</option>
                            <option value="ui">UI Elements</option>
                        </select>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block mb-2 font-medium">File (max 25MB) *</label>
                        <div id="dropZone">
                            <i class="fas fa-cloud-upload-alt text-4xl mb-2"></i>
                            <p>Drag & drop files here</p>
                            <p class="text-sm">or click to browse</p>
                            <input type="file" id="fileInput" class="hidden">
                            <p id="fileName" class="file-name-display"></p>
                        </div>
                        <div id="uploadProgress" class="hidden">
                            <div class="progress-track">
                                <div id="progressBar" class="progress-bar"></div>
                            </div>
                            <span id="progressText">0%</span>
                        </div>
                    </div>
                    
                    <button type="submit" id="uploadBtn" class="btn-primary w-full">
                        <i class="fas fa-upload mr-2"></i> Upload Asset
                    </button>
                </form>
            </div>
        </div>
    `;

    setupFileUpload();
}

function showCommunityPage() {
    mainContent.innerHTML = `
        <div class="page-content">
            <h2 class="text-2xl font-bold mb-6"><i class="fas fa-users mr-2"></i> Community</h2>
            
            <div class="community-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="community-card">
                    <i class="fas fa-comments text-4xl mb-4"></i>
                    <h3>Discussions</h3>
                    <p>Connect with other developers</p>
                    <a href="#forum" class="link-purple">Browse →</a>
                </div>
                
                <div class="community-card">
                    <i class="fas fa-star text-4xl mb-4"></i>
                    <h3>Showcase</h3>
                    <p>See amazing creations</p>
                    <a href="#showcase" class="link-purple">View →</a>
                </div>
                
                <div class="community-card">
                    <i class="fas fa-trophy text-4xl mb-4"></i>
                    <h3>Challenges</h3>
                    <p>Participate in events</p>
                    <a href="#challenges" class="link-purple">Join →</a>
                </div>
            </div>
            
            <h3 class="text-xl font-bold mb-4">Recent Activity</h3>
            <div class="activity-feed bg-gray-800 rounded-xl p-6">
                <!-- Activity will load here -->
            </div>
        </div>
    `;
}

function showProfilePage() {
    if (!currentUser) {
        window.location.hash = '#login';
        return;
    }

    mainContent.innerHTML = `
        <div class="page-content max-w-4xl mx-auto">
            <div class="profile-header flex flex-col md:flex-row gap-6 mb-8">
                <div class="profile-avatar">
                    <div class="avatar-circle">
                        ${currentUser.email.charAt(0).toUpperCase()}
                    </div>
                </div>
                
                <div class="profile-info flex-grow">
                    <h2 class="text-2xl font-bold">${currentUser.email}</h2>
                    <p class="text-gray-400">Member since ${new Date(currentUser.metadata.creationTime).toLocaleDateString()}</p>
                    
                    <div class="stats-grid grid grid-cols-2 gap-4 my-4">
                        <div class="stat-card">
                            <div class="stat-number">12</div>
                            <div class="stat-label">Uploads</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">156</div>
                            <div class="stat-label">Downloads</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-content">
                <h3 class="text-xl font-bold mb-4">Your Uploads</h3>
                <div class="uploads-grid grid grid-cols-1 sm:grid-cols-2 gap-4" id="userUploads">
                    <!-- User's uploads will load here -->
                </div>
            </div>
        </div>
    `;
}

// ======================
// FILE UPLOAD SYSTEM
// ======================
function setupFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Click to select file
    dropZone.addEventListener('click', () => fileInput.click());

    // File selected
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            const file = e.target.files[0];
            if (file.size > 25 * 1024 * 1024) {
                alert('File is too large! Maximum size is 25MB.');
                return;
            }
            fileName.textContent = file.name;
            fileName.style.display = 'block';
        }
    });

    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('drag-over');
    }

    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const file = e.dataTransfer.files[0];
        if (file.size > 25 * 1024 * 1024) {
            alert('File is too large! Maximum size is 25MB.');
            return;
        }
        fileInput.files = e.dataTransfer.files;
        fileName.textContent = file.name;
        fileName.style.display = 'block';
    }

    // Form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file first!');
            return;
        }

        // Show progress
        uploadProgress.style.display = 'flex';
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...';

        try {
            // Upload to Firebase Storage
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`assets/${Date.now()}_${file.name}`);
            const uploadTask = fileRef.put(file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Progress tracking
                    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                },
                (error) => {
                    console.error("Upload failed:", error);
                    alert("Upload failed! " + error.message);
                    resetUploadForm();
                },
                async () => {
                    // Upload complete
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Save to Firestore
                    await db.collection('assets').add({
                        title: document.getElementById('assetTitle').value,
                        description: document.getElementById('assetDescription').value,
                        category: document.getElementById('assetCategory').value,
                        url: downloadURL,
                        filename: file.name,
                        size: (file.size / (1024*1024)).toFixed(1) + "MB",
                        authorId: currentUser.uid,
                        authorEmail: currentUser.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        downloads: 0
                    });
                    
                    // Success
                    alert('Asset uploaded successfully!');
                    window.location.hash = '#home';
                }
            );
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred during upload");
            resetUploadForm();
        }
    });

    function resetUploadForm() {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i> Upload Asset';
        uploadProgress.style.display = 'none';
    }
}

// Initialize
mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
handleRouting();
function showHomePage() {
    mainContent.innerHTML = `
      <div class="page-content">
        <!-- Hero Section with Background Image -->
        <section class="hero-section relative bg-gray-800 rounded-xl overflow-hidden mb-8">
          <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80" 
               alt="Game Development" class="w-full h-64 object-cover opacity-70">
          <div class="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
            <h1 class="text-4xl font-bold mb-4">Welcome to Eyoel's Hub</h1>
            <p class="text-xl mb-6">The ultimate resource for game developers</p>
            ${!currentUser ? `
              <div class="flex flex-wrap justify-center gap-4">
                <a href="#signup" class="btn-primary">
                  <i class="fas fa-user-plus mr-2"></i> Join Now
                </a>
                <a href="#login" class="btn-secondary">
                  <i class="fas fa-sign-in-alt mr-2"></i> Login
                </a>
              </div>
            ` : `
              <a href="#upload" class="btn-primary">
                <i class="fas fa-upload mr-2"></i> Share Your Assets
              </a>
            `}
          </div>
        </section>
        
        <!-- Premium Assets Section (Visible to All) -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-6 flex items-center">
            <i class="fas fa-crown text-yellow-400 mr-2"></i> Premium Assets
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="premiumAssets">
            ${PREMIUM_ASSETS.map(asset => `
              <div class="asset-card">
                <div class="asset-thumbnail" style="background-image: url('${asset.thumb}')"></div>
                <div class="asset-details">
                  <h3>${asset.title}</h3>
                  <p class="text-sm text-gray-400">${asset.description}</p>
                  <div class="asset-footer">
                    <span class="badge">${asset.category}</span>
                    <a href="${asset.url}" download class="download-btn">
                      <i class="fas fa-download"></i> ${asset.size}
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
        
        <!-- Community Uploads Section -->
        <section>
          <h2 class="text-2xl font-bold mb-6">Community Assets</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="communityAssets"></div>
        </section>
      </div>
    `;
    
    loadCommunityAssets();
  }
  