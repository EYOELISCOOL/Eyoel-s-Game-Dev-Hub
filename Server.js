const express = require('express');
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const app = express();

// Google Cloud Storage setup
const storage = new Storage({
  keyFilename: 'your-service-account-key.json' // Download from Firebase
});
const bucket = storage.bucket('your-bucket-name.appspot.com');

// Local storage for uploads
const localUpload = multer({
  dest: './public/uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(express.static('public'));

// Upload endpoint
app.post('/api/upload', localUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    
    // Upload to Google Cloud
    const gcsFile = bucket.file(`assets/${req.file.originalname}`);
    await bucket.upload(req.file.path, {
      destination: gcsFile,
      public: true // Make file publicly accessible
    });
    
    // Delete local copy
    fs.unlinkSync(req.file.path);
    
    res.json({
      url: `https://storage.googleapis.com/${bucket.name}/${gcsFile.name}`,
      localPath: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
// Example progress handler
const xhr = new XMLHttpRequest();
xhr.upload.onprogress = (e) => {
  const percent = Math.round((e.loaded / e.total) * 100);
  progressBar.style.width = `${percent}%`;
};
