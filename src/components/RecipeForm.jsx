import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiX, FiPlus } from 'react-icons/fi';
import { useCategories } from '../hooks/useCategories';
import { useCreateRecipe } from '../hooks/useRecipes';
import useAuthStore from '../store/authStore';

const RecipeForm = ({ onCancel, onSuccess }) => {
  const { user } = useAuthStore();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateRecipe();

  // State cho nguyên liệu, danh mục, link ảnh, lỗi tổng
  const [ingredients, setIngredients] = useState(['']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);
  const [formError, setFormError] = useState('');

  // Form hook
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
      step: '',
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

  // Ảnh minh họa
  const addImageUrl = () => setImageUrls([...imageUrls, '']);
  const removeImageUrl = (index) =>
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  const updateImageUrl = (index, value) => {
    const arr = [...imageUrls];
    arr[index] = value;
    setImageUrls(arr);
  };

  // Danh mục
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Submit
  const onSubmit = (data) => {
    setFormError('');
    // Validate: ít nhất 1 nguyên liệu
    const filteredIngredients = ingredients.filter(i => i.trim() !== '');
    if (filteredIngredients.length === 0) {
      setFormError('Cần nhập ít nhất 1 nguyên liệu!');
      return;
    }
    // Validate: nếu có link ảnh thì phải hợp lệ (có thể mở rộng sau)
    const filteredImages = imageUrls.filter(url => url.trim() !== '');

    const recipeData = {
      ...data,
      price: null,
      ingredients: filteredIngredients,
      imageUrls: filteredImages,
      categoryIds: selectedCategories,
      idUser: user?._id || user?.id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: null,
    };

    createMutation.mutate(recipeData, {
      onSuccess: (response) => {
        console.log('API trả về khi tạo công thức:', response); // LOG RESPONSE Ở ĐÂY!
        const newId = response?._id || response?.id;
        reset();
        setIngredients(['']);
        setImageUrls(['']);
        setSelectedCategories([]);
        onSuccess?.(newId);
      },
      onError: (error) => {
        setFormError(error?.message || 'Có lỗi xảy ra khi lưu công thức!');
      }
    });

  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tạo công thức mới</h2>
        <button onClick={onCancel} className="p-2 text-gray-500 hover:text-gray-700">
          <FiX className="h-6 w-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {formError && <div className="text-red-600 font-semibold mb-2">{formError}</div>}

        {/* Tên công thức */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên công thức *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Tên công thức là bắt buộc' })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả *
          </label>
          <textarea
            rows={3}
            {...register('description', { required: 'Mô tả là bắt buộc' })}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian nấu *
            </label>
            <input
              type="text"
              {...register('cookingTime', { required: 'Thời gian nấu là bắt buộc' })}
              placeholder="VD: 30 phút"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.cookingTime ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.cookingTime && <p className="mt-1 text-sm text-red-600">{errors.cookingTime.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khẩu phần *
            </label>
            <input
              type="text"
              {...register('servings', { required: 'Khẩu phần là bắt buộc' })}
              placeholder="VD: 4 người"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.servings ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.servings && <p className="mt-1 text-sm text-red-600">{errors.servings.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số bước
            </label>
            <input
              type="text"
              {...register('step')}
              placeholder="VD: 5 bước"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Danh mục */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* NGUYÊN LIỆU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nguyên liệu
          </label>
          <div className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={ingredient}
                  onChange={e => updateIngredient(index, e.target.value)}
                  placeholder={`Nguyên liệu ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center space-x-2 text-amber-600 hover:text-amber-700"
            >
              <FiPlus className="h-4 w-4" />
              <span>Thêm nguyên liệu</span>
            </button>
          </div>
        </div>

        {/* ẢNH MINH HOẠ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh minh họa (nhiều link)
          </label>
          {imageUrls.map((url, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={e => updateImageUrl(idx, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              {url && (
                <img
                  src={url}
                  alt="Preview"
                  className="h-12 w-12 object-cover rounded border border-gray-200"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageUrl(idx)}
                  className="p-2 text-red-500 hover:text-red-700"
                  title="Xoá"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImageUrl}
            className="flex items-center space-x-2 text-amber-600 hover:text-amber-700"
          >
            <FiPlus className="h-4 w-4" />
            <span>Thêm link ảnh</span>
          </button>
        </div>

        {/* Nút */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center space-x-2 px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" />
            <span>{createMutation.isPending ? 'Đang tạo...' : 'Tạo công thức'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;
