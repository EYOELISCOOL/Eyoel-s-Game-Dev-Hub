// Initialize asset listings
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('featuredAssets') || document.getElementById('trendingAssets')) {
        loadFeaturedAssets();
        loadTrendingAssets();
    }
    
    if (document.getElementById('assetDetail')) {
        loadAssetDetail();
    }
});

function loadFeaturedAssets() {
    const db = firebase.firestore();
    const featuredContainer = document.getElementById('featuredAssets');
    
    db.collection('assets')
        .where('isFeatured', '==', true)
        .limit(4)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                featuredContainer.innerHTML = '<p>No featured assets found.</p>';
                return;
            }
            
            featuredContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const asset = doc.data();
                featuredContainer.appendChild(createAssetCard(asset, doc.id));
            });
        })
        .catch(error => {
            console.error('Error loading featured assets:', error);
            featuredContainer.innerHTML = '<p>Error loading featured assets.</p>';
        });
}

function loadTrendingAssets() {
    const db = firebase.firestore();
    const trendingContainer = document.getElementById('trendingAssets');
    
    db.collection('assets')
        .orderBy('downloadCount', 'desc')
        .limit(4)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                trendingContainer.innerHTML = '<p>No trending assets found.</p>';
                return;
            }
            
            trendingContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const asset = doc.data();
                trendingContainer.appendChild(createAssetCard(asset, doc.id));
            });
        })
        .catch(error => {
            console.error('Error loading trending assets:', error);
            trendingContainer.innerHTML = '<p>Error loading trending assets.</p>';
        });
}

function createAssetCard(asset, id) {
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.innerHTML = `
        <a href="./asset-detail.html?id=${id}">
            <img src="${asset.previewImages[0] || './images/placeholders/asset-placeholder.jpg'}" alt="${asset.name}" class="asset-image">
            <div class="asset-info">
                <h3 class="asset-title">${asset.name}</h3>
                <span class="asset-engine">${asset.engine}</span>
                <p class="asset-description">${asset.description.substring(0, 100)}...</p>
                <div class="asset-meta">
                    <span>${asset.downloadCount || 0} downloads</span>
                    <span>${calculateAverageRating(asset.ratings)}</span>
                </div>
            </div>
        </a>
    `;
    return card;
}

function calculateAverageRating(ratings) {
    if (!ratings || Object.keys(ratings).length === 0) {
        return 'No ratings';
    }
    
    const values = Object.values(ratings);
    const sum = values.reduce((total, rating) => total + rating, 0);
    const average = sum / values.length;
    
    return '★'.repeat(Math.round(average)) + '☆'.repeat(5 - Math.round(average));
}

function loadAssetDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get('id');
    
    if (!assetId) {
        window.location.href = './assets.html';
        return;
    }
    
    const db = firebase.firestore();
    const assetRef = db.collection('assets').doc(assetId);
    
    assetRef.get().then(doc => {
        if (!doc.exists) {
            window.location.href = './assets.html';
            return;
        }
        
        const asset = doc.data();
        renderAssetDetail(asset, doc.id);
        loadComments(doc.id);
    });
}

function renderAssetDetail(asset, id) {
    document.title = `${asset.name} | EyoArc`;
    
    const assetDetail = document.getElementById('assetDetail');
    const previewImages = document.getElementById('previewImages');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Set main asset details
    document.getElementById('assetTitle').textContent = asset.name;
    document.getElementById('assetEngine').textContent = asset.engine;
    document.getElementById('assetDescription').textContent = asset.description;
    document.getElementById('downloadCount').textContent = asset.downloadCount || 0;
    
    // Set preview images
    previewImages.innerHTML = '';
    asset.previewImages.forEach(imageUrl => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `${asset.name} preview`;
        previewImages.appendChild(img);
    });
    
    // Set download button
    downloadBtn.addEventListener('click', () => {
        incrementDownloadCount(id, asset.downloadCount || 0);
        window.open(asset.downloadUrl, '_blank');
    });
    
    // Set rating system
    setupRatingSystem(id);
}

function incrementDownloadCount(assetId, currentCount) {
    const db = firebase.firestore();
    db.collection('assets').doc(assetId).update({
        downloadCount: currentCount + 1
    });
    
    // Update global download count
    db.collection('stats').doc('downloads').update({
        count: firebase.firestore.FieldValue.increment(1)
    });
}

function setupRatingSystem(assetId) {
    const ratingStars = document.querySelectorAll('.rating-star');
    const user = firebase.auth().currentUser;
    
    if (!user) {
        document.getElementById('ratingSection').innerHTML = '<p>Please login to rate this asset.</p>';
        return;
    }
    
    // Check if user already rated
    const db = firebase.firestore();
    db.collection('assets').doc(assetId).get()
        .then(doc => {
            const ratings = doc.data().ratings || {};
            
            if (ratings[user.uid]) {
                // User already rated
                document.getElementById('ratingSection').innerHTML = `
                    <p>You rated this ${ratings[user.uid]} stars.</p>
                `;
                return;
            }
            
            // Set up rating stars
            ratingStars.forEach(star => {
                star.addEventListener('click', () => {
                    const rating = parseInt(star.dataset.rating);
                    submitRating(assetId, rating);
                });
            });
        });
}

function submitRating(assetId, rating) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const db = firebase.firestore();
    db.collection('assets').doc(assetId).update({
        [`ratings.${user.uid}`]: rating
    })
    .then(() => {
        alert('Thanks for your rating!');
        window.location.reload();
    })
    .catch(error => {
        console.error('Error submitting rating:', error);
        alert('Error submitting rating. Please try again.');
    });
}

function loadComments(assetId) {
    const commentsContainer = document.getElementById('commentsContainer');
    const commentForm = document.getElementById('commentForm');
    
    const db = firebase.firestore();
    db.collection('assets').doc(assetId).collection('comments')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            commentsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                commentsContainer.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
                return;
            }
            
            snapshot.forEach(doc => {
                const comment = doc.data();
                commentsContainer.appendChild(createCommentElement(comment));
            });
        });
    
    if (commentForm) {
        commentForm.addEventListener('submit', e => {
            e.preventDefault();
            const user = firebase.auth().currentUser;
            if (!user) {
                alert('Please login to comment.');
                return;
            }
            
            const content = document.getElementById('commentContent').value.trim();
            if (!content) return;
            
            db.collection('assets').doc(assetId).collection('comments').add({
                userId: user.uid,
                userEmail: user.email,
                content: content,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: {}
            })
            .then(() => {
                document.getElementById('commentContent').value = '';
            })
            .catch(error => {
                console.error('Error adding comment:', error);
                alert('Error adding comment. Please try again.');
            });
        });
    }
}

function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${comment.userEmail}</span>
            <span class="comment-date">${formatDate(comment.createdAt?.toDate())}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
        <div class="comment-actions">
            <button class="like-btn" data-comment-id="${comment.id}">
                Like (${Object.keys(comment.likes || {}).length})
            </button>
        </div>
    `;
    return commentElement;
}

function formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}