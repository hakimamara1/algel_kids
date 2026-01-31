const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadImage } = require('../controllers/uploadController');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Ensure this folder exists or use a temporary dir
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Route
router.post('/', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            // Check if it's a specific Multer error or our custom string error
            return res.status(400).json({ message: err.message || err });
        }
        next();
    });
}, uploadImage);

module.exports = router;
