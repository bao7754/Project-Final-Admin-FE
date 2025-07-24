import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCheck, FiPlus, FiX, FiCamera, FiUpload, FiTrash2 } from 'react-icons/fi';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useAddStep } from '../../hooks/useRecipes';
import { uploadImageToCloudinary, validateImageFile } from '../../utils/cloudinaryUpload';
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
  const [uploadProgress, setUploadProgress] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const addStepMutation = useAddStep();

  // Handle image upload from computer
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
    setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));

    try {
      const imageUrl = await uploadImageToCloudinary(file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [uploadKey]: progress }));
      });

      setImageUrls(prev => [...prev, imageUrl]);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(`Lỗi upload ảnh: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
      setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }));
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
      console.error('Add step error:', error);
      setErrorMessage('Lỗi khi thêm bước: ' + (error.message || 'Unknown error'));
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const isUploading = Object.values(uploadingImages).some(Boolean);
  const totalProgress = Object.values(uploadProgress).reduce((acc, curr) => acc + curr, 0) / Object.keys(uploadProgress).length || 0;

  if (addStepMutation.isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 text-gray-800">
      {/* Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg z-50">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-xl shadow-lg z-50">
          {errorMessage}
        </div>
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
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                rows="5"
                placeholder="Nhập hướng dẫn chi tiết cho bước này..."
                required
              />
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
                required
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-gray-700 font-semibold mb-4 flex items-center">
                <FiCamera className="mr-2 text-blue-600" />
                Hình ảnh minh họa <span className="text-red-500">*</span>
              </label>

              {/* Upload from computer */}
              <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0])}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center justify-center space-x-2 mx-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:bg-blue-300"
                  >
                    <FiUpload className="h-5 w-5" />
                    <span>{isUploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}</span>
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 10MB)
                  </p>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${totalProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 text-center">
                      Đang tải... {Math.round(totalProgress)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Image Preview Grid */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imageUrls.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                        <img
                          src={src}
                          alt={`Ảnh bước ${stepNumber} - ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 transform hover:scale-110"
                        aria-label="Xóa ảnh"
                      >
                        <FiTrash2 className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                          Ảnh {idx + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {imageUrls.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FiCamera className="mx-auto text-4xl mb-2 opacity-50" />
                  <p>Chưa có ảnh minh họa</p>
                  <p className="text-sm">Vui lòng thêm ít nhất 1 ảnh</p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <motion.button
                type="submit"
                onClick={(e) => handleSubmit(e, true)}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
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
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={addStepMutation.isLoading || isUploading}
              >
                <FiCheck className="h-4 w-4" />
                <span>{addStepMutation.isLoading ? 'Đang lưu...' : 'Hoàn thành'}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddStep;