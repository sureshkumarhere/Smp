
const cloudinary = require('cloudinary').v2;

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFiles = async (req, res) => {
    try {
        const uploadPromises = req.files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'my_uploads'
            });
            fs.unlinkSync(file.path); // Delete temp file
            return result.secure_url;
        });

        const uploadedUrls = await Promise.all(uploadPromises);

        res.json({
            message: 'Images uploaded successfully',
            urls: uploadedUrls
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

module.exports = uploadFiles;
