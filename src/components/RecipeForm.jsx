import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiPlus, FiUpload, FiImage, FiClock, FiUsers, FiBookOpen } from 'react-icons/fi';
import { useCategories } from '../hooks/useCategories';
import { useCreateRecipe } from '../hooks/useRecipes';
import useAuthStore from '../store/authStore';
import { 
  uploadMultipleImages, 
  validateMultipleImages, 
  createImagePreview, 
  revokeImagePreview 
} from '../utils/cloudinaryUpload';

const RecipeForm = ({ onCancel, onSuccess }) => {
  const { user } = useAuthStore();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateRecipe();

  const [ingredients, setIngredients] = useState(['']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formError, setFormError] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
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

  // Nguyên liệu
  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index) =>
    setIngredients(ingredients.filter((_, i) => i !== index));
  const updateIngredient = (index, value) => {
    const arr = [...ingredients];
    arr[index] = value;
    setIngredients(arr);
  };

  // Ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const { validFiles, errors: validationErrors } = validateMultipleImages(files);
    
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
    
    setImages(prev => [...prev, ...filesToAdd]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setFormError('');
  };

  const removeImage = (index) => {
    revokeImagePreview(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Danh mục
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Upload images to Cloudinary
  const uploadImagesToCloudinary = async () => {
    if (images.length === 0) return [];
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Đang upload ảnh...');

    try {
      const imageUrls = await uploadMultipleImages(
        images,
        (totalProgress, completed, total) => {
          setUploadProgress(totalProgress);
          setUploadStatus(`Đã upload ${completed}/${total} ảnh (${totalProgress}%)`);
        },
        (imageIndex, progress, fileName) => {
          console.log(`Upload ${fileName}: ${progress}%`);
        }
      );

      setUploadStatus(`Upload thành công ${imageUrls.length} ảnh!`);
      return imageUrls;
    } catch (error) {
      setUploadStatus('Lỗi upload ảnh');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Submit
  const onSubmit = async (data) => {
    setFormError('');
    
    const filteredIngredients = ingredients.filter((i) => i.trim() !== '');
    if (filteredIngredients.length === 0) {
      setFormError('Cần nhập ít nhất 1 nguyên liệu!');
      return;
    }

    try {
      const imageUrls = await uploadImagesToCloudinary();

      const recipeData = {
        ...data,
        price: null,
        ingredients: filteredIngredients,
        imageUrls,
        categoryIds: selectedCategories,
        idUser: user?._id || user?.id || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        approvedAt: null,
      };

      createMutation.mutate(recipeData, {
        onSuccess: (response) => {
          console.log('API trả về khi tạo công thức:', response);
          const newId = response?._id || response?.id;
          
          imagePreviews.forEach(url => revokeImagePreview(url));
          
          reset();
          setIngredients(['']);
          setImages([]);
          setImagePreviews([]);
          setSelectedCategories([]);
          setUploadProgress(0);
          setUploadStatus('');
          
          onSuccess?.(newId);
        },
        onError: (error) => {
          setFormError(error?.message || 'Có lỗi xảy ra khi lưu công thức!');
        },
      });
    } catch (error) {
      setFormError(`Lỗi upload ảnh: ${error.message}`);
    }
  };

  React.useEffect(() => {
    return () => {
      imagePreviews.forEach(url => revokeImagePreview(url));
    };
  }, [imagePreviews]);

  return (
    <div className="min-h-screen bg-gradient-to-br via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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
          {/* Error Alert */}
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

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiUpload className="h-5 w-5 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Đang upload ảnh</h3>
                  <p className="text-sm text-blue-700">{uploadStatus}</p>
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-orange-300'
                      }`}
                      placeholder="VD: Phở bò Hà Nội truyền thống"
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-orange-300'
                      }`}
                      placeholder="Mô tả ngắn gọn về món ăn, hương vị, nguồn gốc..."
                    />
                    {errors.description && <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FiX className="h-4 w-4 mr-1" />
                      {errors.description.message}
                    </p>}
                  </div>
                </div>
              </div>

              {/* Time & Servings */}
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
                      type="text"
                      {...register('cookingTime', { required: 'Thời gian nấu là bắt buộc' })}
                      placeholder="VD: 30 phút"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                        errors.cookingTime ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-green-300'
                      }`}
                    />
                    {errors.cookingTime && <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FiX className="h-4 w-4 mr-1" />
                      {errors.cookingTime.message}
                    </p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <FiUsers className="h-4 w-4 mr-2 text-gray-500" />
                      Khẩu phần *
                    </label>
                    <input
                      type="text"
                      {...register('servings', { required: 'Khẩu phần là bắt buộc' })}
                      placeholder="VD: 4 người"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                        errors.servings ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-green-300'
                      }`}
                    />
                    {errors.servings && <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FiX className="h-4 w-4 mr-1" />
                      {errors.servings.message}
                    </p>}
                  </div>
                </div>
              </div>

              {/* Ingredients */}
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
                      />
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="flex-shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    <FiPlus className="h-5 w-5" />
                    <span className="font-medium">Thêm nguyên liệu</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Categories & Images */}
            <div className="space-y-6">
              {/* Categories */}
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
                        className="w-5 h-5 text-yellow-600 border-2 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
                      />
                      <span className="text-gray-700 font-medium group-hover:text-yellow-700 transition-colors duration-200">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="bg-pink-100 p-2 rounded-lg mr-3">
                    <FiImage className="h-5 w-5 text-pink-600" />
                  </div>
                  Ảnh minh họa
                </h3>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 text-center hover:border-pink-400 hover:bg-pink-50 transition-all duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={isUploading}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label 
                      htmlFor="imageUpload" 
                      className="cursor-pointer flex flex-col items-center space-y-3"
                    >
                      <div className="bg-pink-100 p-4 rounded-full">
                        <FiImage className="h-8 w-8 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-pink-600 font-semibold">Chọn ảnh</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Tối đa 5 ảnh, mỗi ảnh ≤ 10MB
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {imagePreviews.map((previewUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={previewUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-xl border-2 border-gray-200 group-hover:border-pink-300 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            disabled={isUploading}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                            {images[index]?.name?.length > 10 
                              ? images[index].name.substring(0, 10) + '...'
                              : images[index]?.name
                            }
                          </div>
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
                disabled={isUploading || createMutation.isPending}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-semibold disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || isUploading}
                className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <FiSave className="h-5 w-5" />
                <span>
                  {isUploading 
                    ? 'Đang upload ảnh...' 
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