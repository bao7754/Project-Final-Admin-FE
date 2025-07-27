import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiPlus, FiUpload, FiImage, FiClock, FiUsers, FiBookOpen, FiCheck } from 'react-icons/fi';
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
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
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

  const validateImages = (files) => {
    const validFiles = [];
    const errors = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        errors.push(`File ${index + 1}: Chỉ hỗ trợ JPG, PNG, WebP, GIF`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        errors.push(`File ${index + 1}: Kích thước vượt quá 5MB`);
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

  const createImagePreview = (file) => {
    return URL.createObjectURL(file);
  };

  const revokeImagePreview = (url) => {
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

  const uploadSingleImageImmediately = async (file, imageIndex) => {
    const formData = new FormData();
    formData.append('files', file);

    // Update image status to uploading
    setImages(prev => prev.map((img, idx) =>
      idx === imageIndex ? { ...img, status: 'uploading' } : img
    ));

    try {
      const response = await new Promise((resolve, reject) => {
        uploadMutation.mutate(formData, {
          onSuccess: (response) => resolve(response),
          onError: (error) => reject(error)
        });
      });

      let imageUrl;

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

      if (!imageUrl) {
        throw new Error('Không nhận được URL ảnh từ server');
      }

      // Update image status to success and store URL
      setImages(prev => prev.map((img, idx) =>
        idx === imageIndex ? { ...img, status: 'success', url: imageUrl } : img
      ));

      // Update uploaded URLs array
      setUploadedImageUrls(prev => {
        const newUrls = [...prev];
        newUrls[imageIndex] = imageUrl;
        return newUrls;
      });

      return imageUrl;
    } catch (error) {
      console.error('Upload error:', error);

      // Update image status to error
      setImages(prev => prev.map((img, idx) =>
        idx === imageIndex ? {
          ...img,
          status: 'error',
          error: error?.response?.data?.message || error.message || 'Lỗi upload'
        } : img
      ));

      // Handle 401 error specifically
      if (error?.response?.status === 401) {
        setFormError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }

      throw error;
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    const { validFiles, errors: validationErrors } = validateImages(files);

    if (validationErrors.length > 0) {
      setFormError('Lỗi validate ảnh:\n' + validationErrors.join('\n'));
      return;
    }

    const totalImages = images.length + validFiles.length;
    const filesToAdd = totalImages > 5 ? validFiles.slice(0, 5 - images.length) : validFiles;

    if (totalImages > 5) {
      setFormError(`Chỉ được chọn tối đa 5 ảnh. Chỉ ${filesToAdd.length} ảnh đầu tiên được thêm.`);
    }

    const newPreviews = filesToAdd.map(file => createImagePreview(file));
    const newImages = filesToAdd.map((file, index) => ({
      file,
      preview: newPreviews[index],
      status: 'pending', // pending, uploading, success, error
      url: null,
      error: null
    }));

    setImages(prev => [...prev, ...newImages]);
    setImagePreviews(prev => [...prev, ...newPreviews]);

    if (validationErrors.length === 0) {
      setFormError('');
    }

    e.target.value = '';

    // Upload each image immediately
    const startIndex = images.length;
    for (let i = 0; i < newImages.length; i++) {
      const imageIndex = startIndex + i;
      try {
        await uploadSingleImageImmediately(filesToAdd[i], imageIndex);
      } catch (error) {
        // Error already handled in uploadSingleImageImmediately
        console.warn(`Failed to upload image ${i + 1}:`, error.message);
      }
    }
  };

  const removeImage = (index) => {
    // Revoke preview URL
    revokeImagePreview(imagePreviews[index]);

    // Remove from all arrays
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const retryImageUpload = async (index) => {
    const image = images[index];
    if (image && image.file) {
      try {
        await uploadSingleImageImmediately(image.file, index);
      } catch (error) {
        console.warn(`Retry upload failed for image ${index + 1}:`, error.message);
      }
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
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

    // Check authentication
    if (!token) {
      setFormError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      return;
    }

    const filteredIngredients = ingredients.filter((i) => i.trim() !== '');
    if (filteredIngredients.length === 0) {
      setFormError('Cần nhập ít nhất 1 nguyên liệu!');
      return;
    }

    // Check if any images are still uploading
    const uploadingImages = images.filter(img => img.status === 'uploading');
    if (uploadingImages.length > 0) {
      setFormError('Vui lòng đợi upload ảnh hoàn thành trước khi tạo công thức');
      return;
    }

    // Get successfully uploaded image URLs
    const successfulImageUrls = uploadedImageUrls.filter(url => url !== null && url !== undefined);

    try {
      const recipeData = {
        ...data,
        ingredients: filteredIngredients,
        imageUrls: successfulImageUrls,
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

          // Cleanup
          imagePreviews.forEach(url => revokeImagePreview(url));

          reset();
          setIngredients(['']);
          setImages([]);
          setImagePreviews([]);
          setUploadedImageUrls([]);
          setSelectedCategories([]);

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
      imagePreviews.forEach(url => revokeImagePreview(url));
    };
  }, [imagePreviews]);

  // Check token validity
  React.useEffect(() => {
    if (!token && user) {
      console.warn('User exists but token is missing');
      setFormError('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại');
    }
  }, [token, user]);

  // Count images by status
  const uploadingCount = images.filter(img => img.status === 'uploading').length;
  const errorCount = images.filter(img => img.status === 'error').length;
  const successCount = images.filter(img => img.status === 'success').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
                  <h3 className="font-semibold text-blue-900">Đang upload ảnh</h3>
                  <p className="text-sm text-blue-700">
                    {uploadingCount} ảnh đang upload, {successCount} ảnh thành công
                    {errorCount > 0 && `, ${errorCount} ảnh lỗi`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
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
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <FiPlus className="h-5 w-5 text-purple-600" />
                  </div>
                  Nguyên liệu
                </h3>

                <div className="space-y-4">
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
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                    <FiBookOpen className="h-5 w-5 text-yellow-600" />
                  </div>
                  Danh mục
                </h3>

                <div className="space-y-3">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-yellow-50 transition-all duration-200 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                        disabled={createMutation.isPending}
                        className="w-5 h-5 text-yellow-600 border-2 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2 disabled:opacity-50"
                      />
                      <span className="text-gray-700 font-medium group-hover:text-yellow-700 transition-colors duration-200">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="bg-pink-100 p-2 rounded-lg mr-3">
                    <FiImage className="h-5 w-5 text-pink-600" />
                  </div>
                  Ảnh minh họa
                  {images.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({successCount}/{images.length} thành công)
                    </span>
                  )}
                </h3>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 text-center hover:border-pink-400 hover:bg-pink-50 transition-all duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={createMutation.isPending}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className={`cursor-pointer flex flex-col items-center space-y-3 ${createMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                      <div className="bg-pink-100 p-4 rounded-full">
                        <FiImage className="h-8 w-8 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-pink-600 font-semibold">Chọn ảnh</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Tối đa 5 ảnh, mỗi ảnh ≤ 5MB<br />
                          Định dạng: JPG, PNG, WebP, GIF<br />
                          <span className="text-green-600 font-medium">Ảnh sẽ được upload ngay khi chọn</span>
                        </p>
                      </div>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-xl border-2 transition-all duration-200 ${image.status === 'success' ? 'border-green-300' :
                                image.status === 'error' ? 'border-red-300' :
                                  image.status === 'uploading' ? 'border-blue-300' :
                                    'border-gray-200'
                              }`}
                          />

                          {/* Status indicator */}
                          <div className="absolute top-2 left-2">
                            {image.status === 'uploading' && (
                              <div className="bg-blue-500 text-white p-1 rounded-full">
                                <FiUpload className="h-3 w-3 animate-pulse" />
                              </div>
                            )}
                            {image.status === 'success' && (
                              <div className="bg-green-500 text-white p-1 rounded-full">
                                <FiCheck className="h-3 w-3" />
                              </div>
                            )}
                            {image.status === 'error' && (
                              <button
                                type="button"
                                onClick={() => retryImageUpload(index)}
                                className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                                title="Click để thử lại"
                              >
                                <FiX className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            disabled={createMutation.isPending}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg disabled:opacity-30"
                          >
                            <FiX className="h-4 w-4" />
                          </button>

                          {/* File name */}
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                            {image.file?.name?.length > 10
                              ? image.file.name.substring(0, 10) + '...'
                              : image.file?.name
                            }
                          </div>

                          {/* Error message */}
                          {image.status === 'error' && image.error && (
                            <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg max-w-20 truncate" title={image.error}>
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
          </div>

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
                    ? `Đang upload ${uploadingCount} ảnh...`
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