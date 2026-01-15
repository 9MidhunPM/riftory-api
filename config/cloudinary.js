const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary from base64
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImage = async (base64Image, folder = 'riftory/products') => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' }, // Limit max size
        { quality: 'auto:good' }, // Auto quality optimization
        { fetch_format: 'auto' }, // Auto format (webp when supported)
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload multiple images
 * @param {string[]} base64Images - Array of base64 encoded images
 * @param {string} folder - Folder name
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
const uploadMultipleImages = async (base64Images, folder = 'riftory/products') => {
  const uploadPromises = base64Images.map(img => uploadImage(img, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Deleted image: ${publicId}`);
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
    // Don't throw - deletion failure shouldn't break the app
  }
};

/**
 * Delete multiple images
 * @param {string[]} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<void>}
 */
const deleteMultipleImages = async (publicIds) => {
  const deletePromises = publicIds.map(id => deleteImage(id));
  await Promise.all(deletePromises);
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
};
