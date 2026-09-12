const cloudinary = require('cloudinary').v2;
const { env } = require('../config/env');
const { HttpError } = require('../lib/httpError');

cloudinary.config(env.cloudinary);

const isHeic = (file) => /heic|heif/i.test(file.mimetype) || /\.(heic|heif)$/i.test(file.originalname);

const uploadToCloudinary = (file) =>
    new Promise((resolve, reject) => {
        const options = {
            folder: 'malaksit-products',
            // iPhone photos are stored as JPG so every browser can show them
            ...(isHeic(file) && { format: 'jpg' }),
        };
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result)));
        stream.end(file.buffer);
    });

// @route   POST /api/upload   (admin)
const uploadImages = async (req, res) => {
    const single = req.files?.image?.[0];
    const files = single ? [single] : req.files?.images || [];
    if (!files.length) throw new HttpError(400, 'No photo uploaded');

    const started = Date.now();
    let results;
    try {
        results = await Promise.all(files.map(uploadToCloudinary));
    } catch (err) {
        req.log.error({ err }, 'Cloudinary upload failed');
        throw new HttpError(502, 'Photo upload failed, please try again');
    }

    const ms = Date.now() - started;
    for (const result of results) {
        req.log.info({ event: 'upload.done', publicId: result.public_id, bytes: result.bytes, format: result.format, ms }, 'Photo uploaded');
    }

    const images = results.map((result) => ({ url: result.secure_url, publicId: result.public_id }));
    res.json(single ? images[0] : { images });
};

module.exports = { uploadImages };
