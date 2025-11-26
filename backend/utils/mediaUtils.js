const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables if they exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('Cloudinary environment variables are not set. Image uploads may not work properly.');
}

// Function to delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Image ${publicId} deleted from Cloudinary`);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

// Function to upload image to Cloudinary
const uploadImageToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'pinquest',
      allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 800, height: 600, crop: 'limit' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  deleteImageFromCloudinary,
  uploadImageToCloudinary
};