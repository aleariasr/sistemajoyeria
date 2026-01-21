/**
 * Cloudinary Mock for Testing
 * Simulates image upload/delete without actual API calls
 */

let uploadCounter = 1;
const uploadedImages = new Map();

/**
 * Mock uploadImage function
 */
async function uploadImage(fileBuffer, options = {}) {
  const mockId = `test_image_${uploadCounter++}`;
  const mockUrl = `https://res.cloudinary.com/test-cloud/image/upload/v1/${mockId}.jpg`;
  
  uploadedImages.set(mockId, {
    url: mockUrl,
    publicId: mockId,
    format: 'jpg',
    width: 800,
    height: 600,
    bytes: fileBuffer ? fileBuffer.length : 1024,
    createdAt: new Date().toISOString()
  });

  return {
    secure_url: mockUrl,
    public_id: mockId,
    format: 'jpg',
    width: 800,
    height: 600
  };
}

/**
 * Mock deleteImage function
 */
async function deleteImage(publicId) {
  if (uploadedImages.has(publicId)) {
    uploadedImages.delete(publicId);
    return { result: 'ok' };
  }
  return { result: 'not found' };
}

/**
 * Reset mock state
 */
function resetMock() {
  uploadCounter = 1;
  uploadedImages.clear();
}

/**
 * Get all uploaded images (for testing)
 */
function getUploadedImages() {
  return Array.from(uploadedImages.values());
}

module.exports = {
  uploadImage,
  deleteImage,
  resetMock,
  getUploadedImages
};
