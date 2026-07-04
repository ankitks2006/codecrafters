const multer = require('multer');
const path = require('path');
const { AppError } = require('../utils/errors');

const storage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (allowedTypes.includes(ext) || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type .${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`, 400), false);
  }
};

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'webp', 'gif']),
});

const documentUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip']),
});

const assignmentUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter(['pdf', 'doc', 'docx', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'mp4', 'txt', 'py', 'js', 'java', 'cpp', 'c']),
});

const anyFileUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadToCloudinaryBuffer = async (buffer, folder, options = {}) => {
  const { cloudinary } = require('../config/cloudinary');
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `codecrafterstech/${folder}`, ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

module.exports = { imageUpload, documentUpload, assignmentUpload, anyFileUpload, uploadToCloudinaryBuffer };
