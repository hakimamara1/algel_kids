const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary (it might be configured in server.js or a separate config, 
// but ensuring it's configured here or relying on the global config if extracted)
// For safety, we'll re-apply config if environment variables are loaded
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'malaksit-products'
        });

        // Remove file from local temp folder (fs is required)
        // Note: Multer usually stores in /tmp or defined folder. 
        // We should ensure we clean up if we are using diskStorage. 
        // If we use memoryStorage, req.file.buffer is used instead.
        // Let's assume diskStorage for this implementation as it handles large files better.
        if (req.file.path) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            url: result.secure_url,
            publicId: result.public_id
        });

    } catch (error) {
        console.error(error);
        // Clean up even on error
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Image upload failed', error: error.message, stack: error.stack });
    }
};

module.exports = { uploadImage };
