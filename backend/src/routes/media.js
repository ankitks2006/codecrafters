// media.js
const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/apiResponse');
const { authenticate, isAdmin } = require('../middleware/auth');
const { uploadToCloudinaryBuffer } = require('../middleware/upload');
const { deleteFromCloudinary } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return ApiResponse.error(res, 'No file provided', 400);
    const folder = req.body.folder || 'general';
    const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';
    const result = await uploadToCloudinaryBuffer(req.file.buffer, folder, {
      resource_type: resourceType,
      original_filename: req.file.originalname,
    });
    return ApiResponse.success(res, {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
    }, 'File uploaded successfully');
  } catch (e) { next(e); }
});

router.delete('/:publicId', authenticate, isAdmin, async (req, res, next) => {
  try {
    await deleteFromCloudinary(req.params.publicId);
    return ApiResponse.success(res, null, 'File deleted');
  } catch (e) { next(e); }
});

module.exports = router;
