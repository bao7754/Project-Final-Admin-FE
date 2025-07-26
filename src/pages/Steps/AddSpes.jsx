import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCheck, FiPlus, FiX, FiCamera, FiUpload, FiTrash2 } from 'react-icons/fi';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useAddStep } from '../../hooks/useRecipes';
import { useUploadImage } from '../../hooks/useUploadImage';
import Loading from '../../components/Loading';

const AddStep = () => {
  const { id: recipeId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [stepNumber, setStepNumber] = useState(1);
  const [tutorial, setTutorial] = useState('');
  const [duration, setDuration] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  
  // Upload states
  const [uploadingImages, setUploadingImages] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const addStepMutation = useAddStep();
  const uploadImageMutation = useUploadImage();

  // Validate image file - Same as RecipeForm
  const validateImageFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!file) {
      return { isValid: false, error: 'Không có file được chọn' };
    }
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { isValid: false, error: 'Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP, GIF' };
    }
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'File quá lớn. Kích thước tối đa là 10MB' };
    }

    if (!file.name || file.name.length > 255) {
      return { isValid: false, error: 'Tên file không hợp lệ' };
    }
    
    return { isValid: true };
  };

  // Upload single image - Same logic as RecipeForm
  const uploadSingleImage = async (file, index) => {
    const formData = new FormData();
    formData.append('files', file); // Same field name as RecipeForm

    return new Promise((resolve, reject) => {
      uploadImageMutation.mutate(formData, {
        onSuccess: (response) => {
          let imageUrl;
          
          // Same response handling logic as RecipeForm
          if (Array.isArray(response)) {
            if (response.length > 0 && response[0]?.url) {
              imageUrl = response[0].url;
            } else if (response.length > 0) {
              imageUrl = response[0];
            }
          }
          else if (response?.data?.url) {
            imageUrl = response.data.url;
          } else if (response?.url) {
            imageUrl = response.url;
          } else if (response?.data?.filePath) {
            imageUrl = response.data.filePath;
          } else if (response?.filePath) {
            imageUrl = response.filePath;
          } else if (typeof response === 'string') {
            imageUrl = response;
          } else {
            imageUrl = response?.data || response;
          }
          
          console.log(`✅ Upload successful for image ${index + 1}`);
          console.log(`📷 Image URL: ${imageUrl}`);
          resolve(imageUrl);
        },
        onError: (error) => {
          console.error(`❌ Upload failed for image ${index + 1}:`, error);
          reject(error);
        }
      });
    });
  };

  // Handle image upload from computer - Same as RecipeForm
  const handleImageUpload = async (file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const uploadKey = `upload-${Date.now()}`;
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));

    try {
      setSuccessMessage('Đang upload ảnh...');
      
      const imageUrl = await uploadSingleImage(file, imageUrls.length);
      
      if (imageUrl) {
        setImageUrls(prev => [...prev, imageUrl]);
        setSuccessMessage('Upload ảnh thành công!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Không nhận được URL ảnh từ server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error?.response?.data?.message || 
                      error?.response?.data?.error ||
                      error.message || 
                      'Lỗi upload ảnh không xác định';
      setErrorMessage(`Lỗi upload ảnh: ${errorMsg}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleRemoveImage = (idx) => {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e, isNext = false) => {
    e.preventDefault();
    
    if (!tutorial.trim()) {
      setErrorMessage('Vui lòng nhập hướng dẫn!');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    
    if (!duration || parseInt(duration) <= 0) {
      setErrorMessage('Vui lòng nhập thời gian hợp lệ!');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    
    if (imageUrls.length === 0) {
      setErrorMessage('Vui lòng thêm ít nhất một ảnh minh họa!');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const stepData = {
      step: stepNumber,
      tutorial: tutorial.trim(),
      recipeId,
      duration: parseInt(duration) * 60,
      imageUrls: imageUrls.filter(url => url.trim() !== ''),
    };

    console.log('📋 Submitting step data:', stepData);

    try {
      await addStepMutation.mutateAsync(stepData);
      setSuccessMessage('Thêm bước thành công!');
      
      if (isNext) {
        // Reset form cho bước tiếp theo
        setStepNumber(stepNumber + 1);
        setTutorial('');
        setDuration('');
        setImageUrls([]);
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        // Quay về dashboard
        setTimeout(() => {
          navigate(`/dashboard`);
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Add step error:', error);
      const errorMsg = error?.response?.data?.message || 
                      error?.response?.data?.error ||
                      error.message || 
                      'Lỗi không xác định khi thêm bước';
      setErrorMessage(`Lỗi khi thêm bước: ${errorMsg}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const isUploading = Object.values(uploadingImages).some(Boolean) || uploadImageMutation.isLoading;

  if (addStepMutation.isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 text-gray-800">
      {/* Messages */}
      {successMessage && (
        <motion.div 
          className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg z-50 flex items-center gap-2"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          <FiCheck className="h-5 w-5" />
          <span>{successMessage}</span>
        </motion.div>
      )}
      
      {errorMessage && (
        <motion.div 
          className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-xl shadow-lg z-50 flex items-center gap-2"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          <FiX className="h-5 w-5" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8 pt-24 md:pl-72">
        <motion.button
          onClick={() => navigate(`/recipes/${recipeId}`)}
          className="flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Quay lại công thức"
        >
          <FiArrowLeft size={20} /> Quay lại
        </motion.button>

        <motion.div
          className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full mr-4">
              <FiPlus className="text-white" />
            </div>
            Thêm Bước {stepNumber}
          </h2>

          <form className="space-y-6">
            {/* Tutorial */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Hướng dẫn <span className="text-red-500">*</span>
              </label>
              <textarea
                value={tutorial}
                onChange={(e) => setTutorial(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 resize-vertical min-h-[120px]"
                rows="5"
                placeholder="Nhập hướng dẫn chi tiết cho bước này..."
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                {tutorial.length}/1000 ký tự
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                <FiClock className="mr-2 text-blue-600" /> 
                Thời gian (phút) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                placeholder="Nhập thời gian (phút)"
                min="1"
                max="999"
                required
              />
              {duration && (
                <div className="text-sm text-gray-500 mt-1">
                  Tương đương: {Math.floor(duration / 60) > 0 && `${Math.floor(duration / 60)} giờ `}
                  {duration % 60} phút
                </div>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-gray-700 font-semibold mb-4 flex items-center">
                <FiCamera className="mr-2 text-blue-600" />
                Hình ảnh minh họa <span className="text-red-500">*</span>
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({imageUrls.length}/10 ảnh)
                </span>
              </label>

              {/* Upload from computer */}
              <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-400 transition-all duration-300">
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={(e) => handleImageUpload(e.target.files[0])}
                    className="hidden"
                    ref={fileInputRef}
                    disabled={isUploading || imageUrls.length >= 10}
                  />
                  
                  <div className="mb-4">
                    <FiCamera className="mx-auto text-4xl text-gray-400 mb-2" />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || imageUrls.length >= 10}
                    className="flex items-center justify-center space-x-2 mx-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <FiUpload className="h-5 w-5" />
                    <span>
                      {isUploading ? 'Đang tải...' : 
                       imageUrls.length >= 10 ? 'Đã đủ 10 ảnh' : 'Chọn ảnh từ máy'}
                    </span>
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-3">
                    Hỗ trợ: JPG, PNG, WebP, GIF (tối đa 10MB mỗi ảnh)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tối đa 10 ảnh cho mỗi bước
                  </p>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 animate-pulse"
                        style={{ width: '60%' }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 text-center flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      Đang tải lên và xử lý ảnh...
                    </div>
                  </div>
                )}
              </div>

              {/* Image Preview Grid */}
              {imageUrls.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">
                      Ảnh đã tải lên ({imageUrls.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setImageUrls([])}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Xóa tất cả
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageUrls.map((src, idx) => (
                      <motion.div 
                        key={idx} 
                        className="relative group"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300">
                          <img
                            src={src}
                            alt={`Ảnh bước ${stepNumber} - ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              console.error(`Failed to load image ${idx + 1}:`, src);
                              e.target.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop';
                            }}
                            loading="lazy"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 transform hover:scale-110 shadow-lg"
                          aria-label={`Xóa ảnh ${idx + 1}`}
                        >
                          <FiTrash2 className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            Ảnh {idx + 1}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {imageUrls.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FiCamera className="mx-auto text-4xl mb-2 opacity-50" />
                  <p className="font-medium">Chưa có ảnh minh họa</p>
                  <p className="text-sm">Vui lòng thêm ít nhất 1 ảnh để minh họa cho bước này</p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
              <motion.button
                type="submit"
                onClick={(e) => handleSubmit(e, true)}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed order-2 sm:order-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={addStepMutation.isLoading || isUploading}
              >
                <FiPlus className="h-4 w-4" />
                <span>{addStepMutation.isLoading ? 'Đang lưu...' : 'Thêm & Tiếp tục'}</span>
              </motion.button>
              
              <motion.button
                type="submit"
                onClick={(e) => handleSubmit(e, false)}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed order-1 sm:order-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={addStepMutation.isLoading || isUploading}
              >
                <FiCheck className="h-4 w-4" />
                <span>{addStepMutation.isLoading ? 'Đang lưu...' : 'Hoàn thành'}</span>
              </motion.button>
            </div>
            
            {/* Form Status */}
            <div className="text-center text-sm text-gray-500 pt-4">
              <div className="flex items-center justify-center gap-4">
                <span className={`flex items-center gap-1 ${tutorial.trim() ? 'text-green-600' : 'text-gray-400'}`}>
                  {tutorial.trim() ? <FiCheck className="h-4 w-4" /> : <FiX className="h-4 w-4" />}
                  Hướng dẫn
                </span>
                <span className={`flex items-center gap-1 ${duration && parseInt(duration) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {duration && parseInt(duration) > 0 ? <FiCheck className="h-4 w-4" /> : <FiX className="h-4 w-4" />}
                  Thời gian
                </span>
                <span className={`flex items-center gap-1 ${imageUrls.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {imageUrls.length > 0 ? <FiCheck className="h-4 w-4" /> : <FiX className="h-4 w-4" />}
                  Hình ảnh
                </span>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddStep;