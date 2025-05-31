const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Sanitize filenames for Cloudinary public IDs
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-"); // Replace unsafe chars with hyphen
}

const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const originalName = path.basename(file.originalname);
      const ext = path.extname(originalName);
      const nameWithoutExt = path.parse(originalName).name;
      const safeName = sanitizeFileName(nameWithoutExt);

      // Determine resource type
      let resourceType = 'raw';
      if (file.mimetype.startsWith('image/')) resourceType = 'image';
      else if (file.mimetype.startsWith('video/')) resourceType = 'video';

      // Set public_id accordingly
      const public_id = resourceType === 'raw' ? `${safeName}${ext}` : safeName;

      const uploadOptions = {
        folder: 'my_uploads',
        resource_type: resourceType,
        public_id,
        use_filename: false,
        unique_filename: false,
        overwrite: true, // Overwrite if same filename exists
      };

      try {
        const result = await cloudinary.uploader.upload(file.path, uploadOptions);

        return {
          url: result.secure_url,
          type: resourceType,
          name: originalName, // Original filename for frontend display
          size: file.size,
          mimeType: file.mimetype
        };
      } catch (uploadErr) {
        console.error(`Cloudinary upload error for ${originalName}:`, uploadErr);
        throw new Error(`Failed to upload ${originalName}`);
      } finally {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupErr) {
          console.warn("Failed to delete temp file:", cleanupErr);
        }
      }
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error("Upload handler error:", error);
    res.status(500).json({
      message: 'Upload failed',
      error: error.message || 'Internal server error'
    });
  }
};

module.exports = uploadFiles;
