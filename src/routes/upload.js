const express = require('express');
const upload = require('../middlewares/upload');
const { uploadImage } = require('../utils/cloudinary');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const fs = require('fs');
const logger = require('../utils/logger');
const { AppError } = require('../errors');

const router = express.Router();

/**
 * @desc    Upload product image
 * @route   POST /api/v1/upload
 * @access  Private/Admin
 */
router.post('/', [auth, admin, upload.single('image')], async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload an image', 400));
        }

        logger.info('Image upload requested', {
            filename: req.file.filename,
            userId: req.user.id
        });

        const result = await uploadImage(req.file.path, 'products');

        // Remove the file from temporary storage
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            data: {
                url: result.secure_url,
                public_id: result.public_id
            }
        });
    } catch (error) {
        logger.error('Image upload failed', error);

        // Attempt to cleanup if file exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return next(new AppError('Image upload failed. Please try again.', 500));
    }
});

module.exports = router;
