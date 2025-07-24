// utils/cloudinaryUpload.js
const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'dbyxrprwe',
  UPLOAD_PRESET: 'ebookingdoc_new',
  API_URL: 'https://api.cloudinary.com/v1_1/dbyxrprwe/image/upload'
};

/**
 * Upload một ảnh lên Cloudinary
 * @param {File} file - File ảnh cần upload
 * @param {Function} onProgress - Callback để theo dõi tiến trình upload (optional)
 * @returns {Promise<string>} - URL của ảnh đã upload
 */
export const uploadImageToCloudinary = async (file, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CONFIG.CLOUD_NAME);

    // Tạo XMLHttpRequest để có thể theo dõi progress
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          // eslint-disable-next-line no-unused-vars
          } catch (error) {
            reject(new Error('Không thể parse response từ Cloudinary'));
          }
        } else {
          reject(new Error(`Upload thất bại với status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Lỗi mạng khi upload ảnh'));
      });

      xhr.open('POST', CLOUDINARY_CONFIG.API_URL);
      xhr.send(formData);
    });
  } catch (error) {
    throw new Error(`Lỗi upload ảnh: ${error.message}`);
  }
};

/**
 * Upload nhiều ảnh cùng lúc lên Cloudinary
 * @param {File[]} files - Mảng các file ảnh
 * @param {Function} onProgress - Callback để theo dõi tiến trình upload tổng thể (optional)
 * @param {Function} onSingleProgress - Callback để theo dõi tiến trình từng ảnh (optional)
 * @returns {Promise<string[]>} - Mảng URL của các ảnh đã upload
 */
export const uploadMultipleImages = async (files, onProgress = null, onSingleProgress = null) => {
  try {
    const totalFiles = files.length;
    let completedFiles = 0;
    const results = [];

    // Upload từng ảnh
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const imageUrl = await uploadImageToCloudinary(file, (progress) => {
          if (onSingleProgress) {
            onSingleProgress(i, progress, file.name);
          }
        });
        
        results.push(imageUrl);
        completedFiles++;
        
        // Cập nhật progress tổng thể
        if (onProgress) {
          const totalProgress = (completedFiles / totalFiles) * 100;
          onProgress(Math.round(totalProgress), completedFiles, totalFiles);
        }
      } catch (error) {
        console.error(`Lỗi upload ảnh ${file.name}:`, error);
        // Có thể push null hoặc skip, tùy theo yêu cầu
        results.push(null);
        completedFiles++;
        
        if (onProgress) {
          const totalProgress = (completedFiles / totalFiles) * 100;
          onProgress(Math.round(totalProgress), completedFiles, totalFiles);
        }
      }
    }

    // Lọc bỏ các ảnh upload thất bại (null)
    return results.filter(url => url !== null);
  } catch (error) {
    throw new Error(`Lỗi upload nhiều ảnh: ${error.message}`);
  }
};

/**
 * Validate file ảnh trước khi upload
 * @param {File} file - File cần validate
 * @returns {Object} - {isValid: boolean, error: string}
 */
export const validateImageFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    return { isValid: false, error: 'File không tồn tại' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File quá lớn (tối đa 10MB)' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate nhiều file ảnh
 * @param {File[]} files - Mảng file cần validate
 * @returns {Object} - {validFiles: File[], errors: string[]}
 */
export const validateMultipleImages = (files) => {
  const validFiles = [];
  const errors = [];

  files.forEach((file, index) => {
    const validation = validateImageFile(file);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return { validFiles, errors };
};

/**
 * Tạo preview URL cho ảnh
 * @param {File} file - File ảnh
 * @returns {string} - URL preview
 */
export const createImagePreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Giải phóng memory của preview URL
 * @param {string} url - URL preview cần giải phóng
 */
export const revokeImagePreview = (url) => {
  URL.revokeObjectURL(url);
};

// Export default object chứa tất cả functions
export default {
  uploadImageToCloudinary,
  uploadMultipleImages,
  validateImageFile,
  validateMultipleImages,
  createImagePreview,
  revokeImagePreview
};