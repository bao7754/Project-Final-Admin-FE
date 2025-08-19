import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiPlus, FiUpload, FiImage, FiClock, FiUsers, FiBookOpen, FiCheck, FiVideo } from 'react-icons/fi';
import { useCategories } from '../hooks/useCategories';
import { useCreateRecipe } from '../hooks/useRecipes';
import { useUploadImage } from '../hooks/useUploadImage';
import useAuthStore from '../store/authStore';

const RecipeForm = ({ onCancel, onSuccess }) => {
  const { user, token } = useAuthStore();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateRecipe();
  const uploadMutation = useUploadImage();

  const [ingredients, setIngredients] = useState(['']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState([]);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      cookingTime: '',
      servings: '',
    },
  });

  const validateMediaFiles = (files) => {
    const validFiles = [];
    const errors = [];
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    files.forEach((file, index) => {
      const fileType = file.type.toLowerCase();
      
      if (!allowedTypes.includes(fileType)) {
        errors.push(`File ${index + 1}: Chỉ hỗ trợ ảnh (JPG, PNG, WebP, GIF) và video (MP4, WebM, OGG, AVI, MOV)`);
        return;
      }

      const maxSize = allowedImageTypes.includes(fileType) ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeText = allowedImageTypes.includes(fileType) ? '5MB' : '50MB';
        errors.push(`File ${index + 1}: Kích thước vượt quá ${maxSizeText}`);
        return;
      }

      if (!file.name || file.name.length > 255) {
        errors.push(`File ${index + 1}: Tên file không hợp lệ`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  };

  const createMediaPreview = (file) => {
    return URL.createObjectURL(file);
  };

  const revokeMediaPreview = (url) => {
    URL.revokeObjectURL(url);
  };

  const addIngredient = () => setIngredients([...ingredients, '']);

  const removeIngredient = (index) =>
    setIngredients(ingredients.filter((_, i) => i !== index));

  const updateIngredient = (index, value) => {
    const arr = [...ingredients];
    arr[index] = value;
    setIngredients(arr);
  };

  const uploadSingleMediaFileImmediately = async (file, mediaIndex) => {
    const formData = new FormData();
    formData.append('files', file);

    setMediaFiles(prev => prev.map((media, idx) =>
      idx === mediaIndex ? { ...media, status: 'uploading' } : media
    ));

    try {
      const response = await new Promise((resolve, reject) => {
        uploadMutation.mutate(formData, {
          onSuccess: (response) => resolve(response),
          onError: (error) => reject(error)
        });
      });

      let mediaUrl;

      if (Array.isArray(response)) {
        if (response.length > 0 && response[0]?.url) {
          mediaUrl = response[0].url;
        } else if (response.length > 0) {
          mediaUrl = response[0];
        }
      }
      else if (response?.data?.url) {
        mediaUrl = response.data.url;
      } else if (response?.url) {
        mediaUrl = response.url;
      } else if (response?.data?.filePath) {
        mediaUrl = response.data.filePath;
      } else if (response?.filePath) {
        mediaUrl = response.filePath;
      } else if (typeof response === 'string') {
        mediaUrl = response;
      } else {
        mediaUrl = response?.data || response;
      }

      if (!mediaUrl) {
        throw new Error('Không nhận được URL file từ server');
      }

      setMediaFiles(prev => prev.map((media, idx) =>
        idx === mediaIndex ? { ...media, status: 'success', url: mediaUrl } : media
      ));

      setUploadedMediaUrls(prev => {
        const newUrls = [...prev];
        newUrls[mediaIndex] = mediaUrl;
        return newUrls;
      });

      return mediaUrl;
    } catch (error) {
      console.error('Upload error:', error);

      setMediaFiles(prev => prev.map((media, idx) =>
        idx === mediaIndex ? {
          ...media,
          status: 'error',
          error: error?.response?.data?.message || error.message || 'Lỗi upload'
        } : media
      ));

      if (error?.response?.status === 401) {
        setFormError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }

      throw error;
    }
  };

  const handleMediaChange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    const { validFiles, errors: validationErrors } = validateMediaFiles(files);

    if (validationErrors.length > 0) {
      setFormError('Lỗi validate file:\n' + validationErrors.join('\n'));
      return;
    }

    const totalFiles = mediaFiles.length + validFiles.length;
    const filesToAdd = totalFiles > 5 ? validFiles.slice(0, 5 - mediaFiles.length) : validFiles;

    if (totalFiles > 5) {
      setFormError(`Chỉ được chọn tối đa 5 file. Chỉ ${filesToAdd.length} file đầu tiên được thêm.`);
    }

    const newPreviews = filesToAdd.map(file => createMediaPreview(file));
    const newMediaFiles = filesToAdd.map((file, index) => ({
      file,
      preview: newPreviews[index],
      status: 'pending',
      url: null,
      error: null,
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);

    if (validationErrors.length === 0) {
      setFormError('');
    }

    e.target.value = '';

    const startIndex = mediaFiles.length;
    for (let i = 0; i < newMediaFiles.length; i++) {
      const mediaIndex = startIndex + i;
      try {
        await uploadSingleMediaFileImmediately(filesToAdd[i], mediaIndex);
      } catch (error) {
        console.warn(`Failed to upload file ${i + 1}:`, error.message);
      }
    }
  };

  const removeMedia = (index) => {
    revokeMediaPreview(mediaPreviews[index]);
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
    setUploadedMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const retryMediaUpload = async (index) => {
    const media = mediaFiles[index];
    if (media && media.file) {
      try {
        await uploadSingleMediaFileImmediately(media.file, index);
      } catch (error) {
        console.warn(`Retry upload failed for file ${index + 1}:`, error.message);
      }
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];
      // Clear category error when user selects a category
      if (newCategories.length > 0) {
        setCategoryError('');
      }
      
      return newCategories;
    });
  };

  const validateRecipeData = (recipeData) => {
    const errors = [];

    if (!recipeData.name || recipeData.name.trim() === '') {
      errors.push('Tên công thức không được để trống');
    }

    if (!recipeData.description || recipeData.description.trim() === '') {
      errors.push('Mô tả không được để trống');
    }

    if (!recipeData.cookingTime || recipeData.cookingTime.trim() === '') {
      errors.push('Thời gian nấu không được để trống');
    }

    if (!recipeData.servings || recipeData.servings.trim() === '') {
      errors.push('Khẩu phần không được để trống');
    }

    if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      errors.push('Cần có ít nhất 1 nguyên liệu');
    }

    if (recipeData.categoryIds && !Array.isArray(recipeData.categoryIds)) {
      errors.push('categoryIds phải là array');
    }

    if (recipeData.imageUrls && !Array.isArray(recipeData.imageUrls)) {
      errors.push('imageUrls phải là array');
    }

    return errors;
  };

  const onSubmit = async (data) => {
    setFormError('');
    setCategoryError('');

    if (!token) {
      setFormError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      return;
    }

    // Validate categories
    if (selectedCategories.length === 0) {
      setCategoryError('Vui lòng chọn ít nhất một danh mục');
      return;
    }

    const filteredIngredients = ingredients.filter((i) => i.trim() !== '');
    if (filteredIngredients.length === 0) {
      setFormError('Cần nhập ít nhất 1 nguyên liệu!');
      return;
    }

    const uploadingFiles = mediaFiles.filter(media => media.status === 'uploading');
    if (uploadingFiles.length > 0) {
      setFormError('Vui lòng đợi upload file hoàn thành trước khi tạo công thức');
      return;
    }

    const successfulMediaUrls = uploadedMediaUrls.filter(url => url !== null && url !== undefined);

    try {
      const recipeData = {
        ...data,
        ingredients: filteredIngredients,
        imageUrls: successfulMediaUrls,
        categoryIds: selectedCategories,
        ...(user?._id || user?.id || user?.userId ? { idUser: user._id || user.id || user.userId } : {}),
      };

      const validationErrors = validateRecipeData(recipeData);
      if (validationErrors.length > 0) {
        setFormError('Lỗi validation:\n' + validationErrors.join('\n'));
        return;
      }

      createMutation.mutate(recipeData, {
        onSuccess: (response) => {
          const newId = response?._id ||
            response?.id ||
            response?.data?._id ||
            response?.data?.id ||
            response?.recipe?._id ||
            response?.recipe?.id;

          mediaPreviews.forEach(url => revokeMediaPreview(url));

          reset();
          setIngredients(['']);
          setMediaFiles([]);
          setMediaPreviews([]);
          setUploadedMediaUrls([]);
          setSelectedCategories([]);
          setCategoryError('');

          if (onSuccess) {
            onSuccess(newId);
          }
        },
        onError: (error) => {
          let errorMessage = 'Có lỗi xảy ra khi lưu công thức!';

          if (error?.response?.status === 401) {
            setFormError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            return;
          }

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.message) {
            errorMessage = error.message;
          }

          if (error.response?.data?.errors) {
            const serverErrors = error.response.data.errors;
            if (Array.isArray(serverErrors)) {
              errorMessage += '\nChi tiết: ' + serverErrors.join(', ');
            } else {
              errorMessage += '\nChi tiết: ' + JSON.stringify(serverErrors);
            }
          }

          setFormError(`Lỗi server (${error.response?.status}): ${errorMessage}`);
        },
      });
    } catch (error) {
      setFormError(`Lỗi không xác định: ${error.message}`);
    }
  };

  React.useEffect(() => {
    return () => {
      mediaPreviews.forEach(url => revokeMediaPreview(url));
    };
  }, [mediaPreviews]);

  React.useEffect(() => {
    if (!token && user) {
      console.warn('User exists but token is missing');
      setFormError('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại');
    }
  }, [token, user]);

  const uploadingCount = mediaFiles.filter(media => media.status === 'uploading').length;
  const errorCount = mediaFiles.filter(media => media.status === 'error').length;
  const successCount = mediaFiles.filter(media => media.status === 'success').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FiBookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Tạo công thức mới</h2>
                  <p className="text-orange-100 mt-1">Chia sẻ công thức nấu ăn tuyệt vời của bạn</p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <FiX className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {formError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-xl shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiX className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-red-700 font-medium whitespace-pre-line">{formError}</p>
                </div>
              </div>
            </div>
          )}

          {uploadingCount > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiUpload className="h-5 w-5 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Đang upload file</h3>
                  <p className="text-sm text-blue-700">
                    {uploadingCount} file đang upload, {successCount} file thành công
                    {errorCount > 0 && `, ${errorCount} file lỗi`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main content - Full width */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-orange-100 p-2 rounded-lg mr-3">
                  <FiBookOpen className="h-5 w-5 text-orange-600" />
                </div>
                Thông tin cơ bản
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tên công thức *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Tên công thức là bắt buộc' })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-orange-300'
                      }`}
                    placeholder="VD: Phở bò Hà Nội truyền thống"
                    disabled={createMutation.isPending}
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600 flex items-center">
                    <FiX className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mô tả *
                  </label>
                  <textarea
                    rows={4}
                    {...register('description', { required: 'Mô tả là bắt buộc' })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-orange-300'
                      }`}
                    placeholder="Mô tả ngắn gọn về món ăn, hương vị, nguồn gốc..."
                    disabled={createMutation.isPending}
                  />
                  {errors.description && <p className="mt-2 text-sm text-red-600 flex items-center">
                    <FiX className="h-4 w-4 mr-1" />
                    {errors.description.message}
                  </p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <FiClock className="h-5 w-5 text-green-600" />
                </div>
                Thời gian & Khẩu phần
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FiClock className="h-4 w-4 mr-2 text-gray-500" />
                    Thời gian nấu *
                  </label>
                  <input
                    type="number"
                    {...register('cookingTime', {
                      required: 'Thời gian nấu là bắt buộc',
                      min: {
                        value: 1,
                        message: 'Thời gian nấu phải lớn hơn 0'
                      }
                    })}
                    placeholder="VD: 30"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${errors.cookingTime ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-green-300'
                      }`}
                    disabled={createMutation.isPending}
                  />
                  {errors.cookingTime && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FiX className="h-4 w-4 mr-1" />
                      {errors.cookingTime.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FiUsers className="h-4 w-4 mr-2 text-gray-500" />
                    Khẩu phần *
                  </label>
                  <input
                    type="number"
                    {...register('servings', {
                      required: 'Khẩu phần là bắt buộc',
                      min: {
                        value: 1,
                        message: 'Khẩu phần phải lớn hơn 0'
                      }
                    })}
                    placeholder="VD: 4"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${errors.servings ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-green-300'
                      }`}
                    disabled={createMutation.isPending}
                  />
                  {errors.servings && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FiX className="h-4 w-4 mr-1" />
                      {errors.servings.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                  <FiBookOpen className="h-5 w-5 text-yellow-600" />
                </div>
                Danh mục *
              </h3>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryChange(category.id)}
                      disabled={createMutation.isPending}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 disabled:opacity-50 ${
                        selectedCategories.includes(category.id)
                          ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg transform scale-105'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-400 hover:text-yellow-700 hover:bg-yellow-50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                {categoryError && (
                  <p className="text-sm text-red-600 flex items-center">
                    <FiX className="h-4 w-4 mr-1" />
                    {categoryError}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <FiPlus className="h-5 w-5 text-purple-600" />
                </div>
                Nguyên liệu
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-3 group">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">{index + 1}</span>
                      </div>
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        placeholder={`Nguyên liệu ${index + 1}`}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                        disabled={createMutation.isPending}
                      />
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          disabled={createMutation.isPending}
                          className="flex-shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-30"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addIngredient}
                  disabled={createMutation.isPending}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  <FiPlus className="h-5 w-5" />
                  <span className="font-medium">Thêm nguyên liệu</span>
                </button>
              </div>
            </div>

            {/* Media Upload Section - Bottom */}
            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-pink-100 p-2 rounded-lg mr-3">
                  <FiImage className="h-5 w-5 text-pink-600" />
                </div>
                Ảnh & Video minh họa
                {mediaFiles.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({successCount}/{mediaFiles.length} thành công)
                  </span>
                )}
              </h3>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-pink-300 rounded-xl p-8 text-center hover:border-pink-400 hover:bg-pink-50 transition-all duration-200">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                    disabled={createMutation.isPending}
                    className="hidden"
                    id="mediaUpload"
                  />
                  <label
                    htmlFor="mediaUpload"
                    className={`cursor-pointer flex flex-col items-center space-y-4 ${createMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <div className="bg-pink-100 p-6 rounded-full">
                      <div className="flex space-x-2">
                        <FiImage className="h-10 w-10 text-pink-600" />
                        <FiVideo className="h-10 w-10 text-pink-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-pink-600 font-bold text-lg">Chọn ảnh hoặc video</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Tối đa 5 file<br />
                        Ảnh: ≤ 5MB (JPG, PNG, WebP, GIF)<br />
                        Video: ≤ 50MB (MP4, WebM, OGG, AVI, MOV)<br />
                        <span className="text-green-600 font-medium">File sẽ được upload ngay khi chọn</span>
                      </p>
                    </div>
                  </label>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative group">
                        {media.type === 'image' ? (
                          <img
                            src={media.preview}
                            alt={`Preview ${index + 1}`}
                            className={`w-full h-32 object-cover rounded-xl border-2 transition-all duration-200 ${media.status === 'success' ? 'border-green-300' :
                                media.status === 'error' ? 'border-red-300' :
                                  media.status === 'uploading' ? 'border-blue-300' :
                                    'border-gray-200'
                              }`}
                          />
                        ) : (
                          <div className="relative">
                            <video
                              src={media.preview}
                              className={`w-full h-32 object-cover rounded-xl border-2 transition-all duration-200 ${media.status === 'success' ? 'border-green-300' :
                                  media.status === 'error' ? 'border-red-300' :
                                    media.status === 'uploading' ? 'border-blue-300' :
                                      'border-gray-200'
                                }`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FiVideo className="h-10 w-10 text-white bg-black/50 rounded-full p-2" />
                            </div>
                          </div>
                        )}

                        {/* Status indicator */}
                        <div className="absolute top-2 left-2">
                          {media.status === 'uploading' && (
                            <div className="bg-blue-500 text-white p-1.5 rounded-full shadow-lg">
                              <FiUpload className="h-4 w-4 animate-pulse" />
                            </div>
                          )}
                          {media.status === 'success' && (
                            <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                              <FiCheck className="h-4 w-4" />
                            </div>
                          )}
                          {media.status === 'error' && (
                            <button
                              type="button"
                              onClick={() => retryMediaUpload(index)}
                              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors shadow-lg"
                              title="Click để thử lại"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          disabled={createMutation.isPending}
                          className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg disabled:opacity-30"
                        >
                          <FiX className="h-5 w-5" />
                        </button>

                        {/* File name */}
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm max-w-24 truncate">
                          {media.file?.name?.length > 15
                            ? media.file.name.substring(0, 12) + '...'
                            : media.file?.name
                          }
                        </div>

                        {/* Error message */}
                        {media.status === 'error' && media.error && (
                          <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg max-w-16 truncate" title={media.error}>
                            Lỗi
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit buttons - Bottom */}
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={createMutation.isPending}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || uploadingCount > 0}
                className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="h-5 w-5" />
                <span>
                  {uploadingCount > 0
                    ? `Đang upload ${uploadingCount} file...`
                    : createMutation.isPending
                      ? 'Đang tạo công thức...'
                      : 'Tạo công thức'
                  }
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeForm;