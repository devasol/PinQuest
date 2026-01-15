/**
 * Utility functions for handling image uploads and processing
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Process uploaded files from multer
 * @param {Object} req - Express request object
 * @param {string} protocol - Request protocol (http/https)
 * @param {string} host - Request host
 * @returns {Object} Processed image objects
 */
const processUploadedImages = (req, protocol, host) => {
  let image = null;
  let imagesArr = [];

  // Handle multiple file uploads
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    for (const file of req.files) {
      const processedImage = processImageFile(file, protocol, req);
      if (processedImage) {
        imagesArr.push(processedImage);
      }
    }

    // Keep first image in `image` for backward compatibility
    if (imagesArr.length > 0) image = imagesArr[0];
  }
  // Handle single file upload
  else if (req.file) {
    const processedImage = processImageFile(req.file, protocol, req);
    if (processedImage) {
      image = processedImage;
      imagesArr = [image];
    }
  }
  // Handle image provided in request body as URL (for backward compatibility)
  else if (req.body.image) {
    image = { url: req.body.image, publicId: null };
  }

  return { image, imagesArr };
};

/**
 * Process a single uploaded file
 * @param {Object} file - Multer file object
 * @param {string} protocol - Request protocol (http/https)
 * @param {Object} req - Express request object (to get proper host with port)
 * @returns {Object|null} Processed image object or null if invalid
 */
const processImageFile = (file, protocol, req) => {
  try {
    if (!file) return null;

    // If file object contains a remote URL (Cloudinary, etc.)
    if (typeof file === 'object') {
      const url = file.secure_url || file.url || file.location || (typeof file.path === 'string' && file.path.startsWith('http') ? file.path : null);
      if (url) {
        const publicId = file.public_id || file.publicId || file.filename || null;
        return { url, publicId };
      }

      // If multer wrote a local file to disk
      if (file.path && typeof file.path === 'string' && !file.path.startsWith('http')) {
        const filename = path.basename(file.path);
        // Use a relative URL for flexibility, or construct absolute if needed
        // The frontend will normalize this anyway with getImageUrl
        const fullHost = req && typeof req.get === 'function' ? (req.get('host') || req.headers.host) : 'localhost:5000';
        const url = `${protocol || 'http'}://${fullHost}/uploads/${filename}`.replace(/([^:]\/)\/+/g, '$1');
        return { url, filename, localPath: file.path };
      }
    }

    return null;
  } catch (uploadError) {
    console.error('Error processing uploaded file:', uploadError);
    return null;
  }
};

/**
 * Delete local image files from disk
 * @param {Array|Object} images - Array of image objects or single image object
 * @param {string} uploadDir - Uploads directory path
 */
const deleteLocalImages = async (images, uploadDir) => {
  try {
    const imagesToDelete = Array.isArray(images) ? images : [images].filter(img => img);

    for (const img of imagesToDelete) {
      if (img && img.localPath) {
        await fs.unlink(img.localPath).catch(() => {});
      } else if (img && img.filename) {
        const filePath = path.join(uploadDir, img.filename);
        await fs.unlink(filePath).catch(() => {});
      }
    }
  } catch (e) {
    console.error('Error deleting local images:', e);
  }
};

/**
 * Get image URL from image object
 * @param {Object|string} imageObj - Image object or URL string
 * @param {string} serverBaseUrl - Base server URL
 * @returns {string} Complete image URL
 */
const getImageUrl = (imageObj, serverBaseUrl) => {
  if (!imageObj) return '';
  
  if (typeof imageObj === 'string') {
    return imageObj.startsWith('http') ? imageObj : `${serverBaseUrl}${imageObj}`;
  }
  
  if (imageObj.url) {
    return imageObj.url.startsWith('http') ? imageObj.url : `${serverBaseUrl}${imageObj.url}`;
  }
  
  return '';
};

module.exports = {
  processUploadedImages,
  processImageFile,
  deleteLocalImages,
  getImageUrl
};