const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadToCloudinary = async (filePath, folder, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `codecrafterstech/${folder}`,
      ...options,
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

const uploadStream = (folder, options = {}) => {
  return cloudinary.uploader.upload_stream(
    { folder: `codecrafterstech/${folder}`, ...options },
    (error, result) => {
      if (error) throw error;
      return result;
    }
  );
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary, uploadStream };
