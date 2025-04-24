// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('adminDashboard')) return;
    
    const user = firebase.auth().currentUser;
    if (!user) {
        window.location.href = './auth.html';
        return;
    }
    
    // Verify admin status
    user.getIdTokenResult().then(idTokenResult => {
        if (!idTokenResult.claims.admin) {
            window.location.href = './index.html';
        } else {
            loadAdminDashboard();
        }
    });
});

function loadAdminDashboard() {
    loadUserManagement();
    loadAssetManagement();
    loadStats();
    
    // Set up asset upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleAssetUpload);
    }
}

function loadUserManagement() {
    const db = firebase.firestore();
    const usersContainer = document.getElementById('usersContainer');
    
    db.collection('users').get().then(snapshot => {
        usersContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const user = doc.data();
            usersContainer.appendChild(createUserElement(user, doc.id));
        });
    });
}

function createUserElement(user, userId) {
    const userElement = document.createElement('div');
    userElement.className = 'admin-user-card';
    userElement.innerHTML = `
        <div class="user-info">
            <h4>${user.email}</h4>
            <p>Joined: ${formatDate(user.createdAt?.toDate())}</p>
            <p>Admin: ${user.isAdmin ? 'Yes' : 'No'}</p>
        </div>
        <div class="user-actions">
            <button class="btn-toggle-admin" data-user-id="${userId}" data-is-admin="${user.isAdmin}">
                ${user.isAdmin ? 'Remove Admin' : 'Make Admin'}
            </button>
            <button class="btn-ban-user" data-user-id="${userId}">
                Ban User
            </button>
        </div>
    `;
    
    // Add event listeners
    userElement.querySelector('.btn-toggle-admin').addEventListener('click', toggleAdminStatus);
    userElement.querySelector('.btn-ban-user').addEventListener('click', banUser);
    
    return userElement;
}

function toggleAdminStatus(e) {
    const userId = e.target.dataset.userId;
    const isAdmin = e.target.dataset.isAdmin === 'true';
    
    const db = firebase.firestore();
    db.collection('users').doc(userId).update({
        isAdmin: !isAdmin
    })
    .then(() => {
        alert('User admin status updated successfully!');
        loadUserManagement();
    })
    .catch(error => {
        console.error('Error updating admin status:', error);
        alert('Error updating admin status. Please try again.');
    });
}

function banUser(e) {
    const userId = e.target.dataset.userId;
    
    if (confirm('Are you sure you want to ban this user?')) {
        const db = firebase.firestore();
        db.collection('users').doc(userId).update({
            isBanned: true
        })
        .then(() => {
            alert('User banned successfully!');
            loadUserManagement();
        })
        .catch(error => {
            console.error('Error banning user:', error);
            alert('Error banning user. Please try again.');
        });
    }
}

function loadAssetManagement() {
    const db = firebase.firestore();
    const assetsContainer = document.getElementById('assetsContainer');
    
    db.collection('assets').get().then(snapshot => {
        assetsContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const asset = doc.data();
            assetsContainer.appendChild(createAssetManagementElement(asset, doc.id));
        });
    });
}

function createAssetManagementElement(asset, assetId) {
    const assetElement = document.createElement('div');
    assetElement.className = 'admin-asset-card';
    assetElement.innerHTML = `
        <div class="asset-info">
            <h4>${asset.name}</h4>
            <p>Engine: ${asset.engine}</p>
            <p>Downloads: ${asset.downloadCount || 0}</p>
            <p>Rating: ${calculateAverageRating(asset.ratings)}</p>
        </div>
        <div class="asset-actions">
            <button class="btn-feature-asset" data-asset-id="${assetId}" data-is-featured="${asset.isFeatured || false}">
                ${asset.isFeatured ? 'Unfeature' : 'Feature'}
            </button>
            <button class="btn-delete-asset" data-asset-id="${assetId}">
                Delete
            </button>
        </div>
    `;
    
    // Add event listeners
    assetElement.querySelector('.btn-feature-asset').addEventListener('click', toggleFeaturedStatus);
    assetElement.querySelector('.btn-delete-asset').addEventListener('click', deleteAsset);
    
    return assetElement;
}

function toggleFeaturedStatus(e) {
    const assetId = e.target.dataset.assetId;
    const isFeatured = e.target.dataset.isFeatured === 'true';
    
    const db = firebase.firestore();
    db.collection('assets').doc(assetId).update({
        isFeatured: !isFeatured
    })
    .then(() => {
        alert('Asset featured status updated successfully!');
        loadAssetManagement();
    })
    .catch(error => {
        console.error('Error updating featured status:', error);
        alert('Error updating featured status. Please try again.');
    });
}

function deleteAsset(e) {
    const assetId = e.target.dataset.assetId;
    
    if (confirm('Are you sure you want to delete this asset? This cannot be undone.')) {
        const db = firebase.firestore();
        db.collection('assets').doc(assetId).delete()
            .then(() => {
                alert('Asset deleted successfully!');
                loadAssetManagement();
            })
            .catch(error => {
                console.error('Error deleting asset:', error);
                alert('Error deleting asset. Please try again.');
            });
    }
}

function loadStats() {
    const db = firebase.firestore();
    
    // Total users
    db.collection('users').get().then(snapshot => {
        document.getElementById('totalUsers').textContent = snapshot.size;
    });
    
    // Total assets
    db.collection('assets').get().then(snapshot => {
        document.getElementById('totalAdminAssets').textContent = snapshot.size;
    });
    
    // Total downloads
    db.collection('stats').doc('downloads').get().then(doc => {
        if (doc.exists) {
            document.getElementById('totalAdminDownloads').textContent = doc.data().count.toLocaleString();
        }
    });
}

function handleAssetUpload(e) {
    e.preventDefault();
    
    const uploadButton = document.getElementById('uploadButton');
    const progressBar = document.getElementById('uploadProgress');
    const statusMessage = document.getElementById('uploadStatus');
    
    const name = document.getElementById('assetName').value.trim();
    const engine = document.getElementById('assetEngine').value;
    const tags = document.getElementById('assetTags').value.split(',').map(tag => tag.trim());
    const description = document.getElementById('assetDescription').value.trim();
    const fileInput = document.getElementById('assetFile');
    const previewImagesInput = document.getElementById('previewImagesInput');
    
    if (!name || !engine || !description || !fileInput.files[0]) {
        statusMessage.textContent = 'Please fill in all required fields.';
        statusMessage.style.color = 'var(--danger-color)';
        return;
    }
    
    uploadButton.disabled = true;
    statusMessage.textContent = 'Uploading asset...';
    statusMessage.style.color = 'var(--dark-color)';
    
    const db = firebase.firestore();
    const storageRef = firebase.storage().ref();
    
    // Upload main asset file
    const file = fileInput.files[0];
    const fileRef = storageRef.child(`assets/${Date.now()}_${file.name}`);
    const uploadTask = fileRef.put(file);
    
    uploadTask.on('state_changed', 
        snapshot => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.value = progress;
        },
        error => {
            // Handle unsuccessful uploads
            console.error('Error uploading file:', error);
            statusMessage.textContent = 'Error uploading file. Please try again.';
            statusMessage.style.color = 'var(--danger-color)';
            uploadButton.disabled = false;
        },
        () => {
            // Handle successful uploads
            uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                // Upload preview images
                uploadPreviewImages(previewImagesInput.files).then(previewURLs => {
                    // Create asset in Firestore
                    db.collection('assets').add({
                        name: name,
                        engine: engine,
                        tags: tags,
                        description: description,
                        downloadUrl: downloadURL,
                        previewImages: previewURLs,
                        downloadCount: 0,
                        ratings: {},
                        isFeatured: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    })
                    .then(() => {
                        statusMessage.textContent = 'Asset uploaded successfully!';
                        statusMessage.style.color = 'var(--success-color)';
                        progressBar.value = 0;
                        uploadButton.disabled = false;
                        document.getElementById('uploadForm').reset();
                        
                        // Update stats
                        db.collection('stats').doc('assets').update({
                            count: firebase.firestore.FieldValue.increment(1)
                        });
                    })
                    .catch(error => {
                        console.error('Error adding asset:', error);
                        statusMessage.textContent = 'Error adding asset. Please try again.';
                        statusMessage.style.color = 'var(--danger-color)';
                        uploadButton.disabled = false;
                    });
                });
            });
        }
    );
}

function uploadPreviewImages(files) {
    const storageRef = firebase.storage().ref();
    const uploadPromises = [];
    
    if (!files || files.length === 0) {
        // Use default placeholder if no images provided
        return Promise.resolve(['./images/placeholders/asset-placeholder.jpg']);
    }
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = storageRef.child(`previews/${Date.now()}_${file.name}`);
        uploadPromises.push(fileRef.put(file).then(snapshot => snapshot.ref.getDownloadURL()));
    }
    
    return Promise.all(uploadPromises);
}