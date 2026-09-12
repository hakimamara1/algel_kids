const express = require('express');
const multer = require('multer');
const requireAdmin = require('../middleware/requireAdmin');
const { HttpError } = require('../lib/httpError');
const { uploadImages } = require('../controllers/uploadController');

const router = express.Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
// Some phones send HEIC photos without a proper type, so the extension is checked too
const HEIC_NAME = /\.(heic|heif)$/i;

// Photos stay in memory and are streamed to Cloudinary: Render's disk is not used
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024, files: 10 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype) || HEIC_NAME.test(file.originalname)) return cb(null, true);
        cb(new HttpError(400, 'Only JPG, PNG, WEBP or HEIC photos are allowed'));
    },
});

// "image": one photo (the current admin), "images": up to 10 at once
router.post(
    '/',
    requireAdmin,
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
    uploadImages
);

module.exports = router;
