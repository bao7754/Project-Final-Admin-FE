import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX, FiPlus, FiTag, FiAward, FiUpload } from 'react-icons/fi';
import { useRecipe, useUpdateRecipe, useRecipeSteps, useUpdateStep } from '../../hooks/useRecipes';
import { useCategories } from '../../hooks/useCategories';
import Loading from '../../components/Loading';

const RecipeEdit = () => {
  const { id } = useParams();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const { data: categories = [] } = useCategories();
  const { data: steps = [], isLoading: isStepsLoading, error: stepsError } = useRecipeSteps(id);
  const updateRecipe = useUpdateRecipe();
  const updateStep = useUpdateStep();
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState(['']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);
  const [recipeSteps, setRecipeSteps] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      cookingTime: '',
      servings: '',
    },
  });

  const placeholderImages = [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
  ];

  const extractCategoryIds = useCallback((categoryData) => {
    if (!categoryData || !Array.isArray(categoryData)) return [];
    return categoryData
      .map(item => (typeof item === 'object' && item !== null ? item._id || item.id : item))
      .filter(Boolean);
  }, []);

  useEffect(() => {
    if (!recipe) return;
    setValue('name', recipe.name || '');
    setValue('description', recipe.description || '');
    setValue('price', recipe.price || '');
    setValue('cookingTime', recipe.cookingTime || '');
    setValue('servings', recipe.servings || '');
    setIngredients(recipe.ingredients?.length > 0 ? recipe.ingredients : ['']);
    setImageUrls(recipe.imageUrls?.length > 0 ? recipe.imageUrls : ['']);
    let categoryIds = [];
    if (recipe.categoryIds) {
      categoryIds = extractCategoryIds(recipe.categoryIds);
    } else if (recipe.categories) {
      categoryIds = extractCategoryIds(recipe.categories);
    }
    setSelectedCategories(categoryIds);
  }, [recipe, setValue, extractCategoryIds]);

  useEffect(() => {
    if (steps?.length > 0) {
      setRecipeSteps(
        steps
          .sort((a, b) => a.step - b.step)
          .map(step => ({
            id: step._id || step.id,
            step: step.step || '',
            tutorial: step.tutorial || '',
            duration: step.duration ? String(Math.round(step.duration / 60)) : '',
            imageUrls: step.imageUrls?.length > 0 ? step.imageUrls : [''],
          }))
      );
    } else {
      setRecipeSteps([{ step: '1', tutorial: '', duration: '', imageUrls: [''] }]);
    }
  }, [steps]);

  const addIngredient = useCallback(() => {
    setIngredients(prev => [...prev, '']);
  }, []);

  const removeIngredient = useCallback((index) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateIngredient = useCallback((index, value) => {
    setIngredients(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }, []);

  const addStep = useCallback(() => {
    setRecipeSteps(prev => [
      ...prev,
      { step: (prev.length + 1).toString(), tutorial: '', duration: '', imageUrls: [''] },
    ]);
  }, []);

  const removeStep = useCallback((index) => {
    setRecipeSteps(prev => prev.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      step: (i + 1).toString(),
    })));
  }, []);

  const updateStepField = useCallback((index, field, value) => {
    setRecipeSteps(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }, []);

  const updateStepImage = useCallback((stepIndex, imageIndex, value) => {
    setRecipeSteps(prev => {
      const copy = [...prev];
      const imageUrls = [...copy[stepIndex].imageUrls];
      imageUrls[imageIndex] = value;
      copy[stepIndex] = { ...copy[stepIndex], imageUrls };
      return copy;
    });
  }, []);

  const addStepImage = useCallback((stepIndex) => {
    setRecipeSteps(prev => {
      const copy = [...prev];
      copy[stepIndex] = { ...copy[stepIndex], imageUrls: [...copy[stepIndex].imageUrls, ''] };
      return copy;
    });
  }, []);

  const removeStepImage = useCallback((stepIndex, imageIndex) => {
    setRecipeSteps(prev => {
      const copy = [...prev];
      copy[stepIndex] = {
        ...copy[stepIndex],
        imageUrls: copy[stepIndex].imageUrls.filter((_, i) => i !== imageIndex).length > 0
          ? copy[stepIndex].imageUrls.filter((_, i) => i !== imageIndex)
          : [''],
      };
      return copy;
    });
  }, []);

  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  }, []);

  const handleNavigation = useCallback(() => {
    console.log('Attempting to navigate to /dashboard');
    try {
      navigate('/recipes');
      console.log('Navigation to /dashboard triggered');
      setSuccessMessage(''); 
    } catch (err) {
      console.error('Navigation error:', err);
      setErrorMessage('Lỗi khi chuyển hướng: ' + (err.message || 'Unknown error'));
    }
  }, [navigate]);

  const onSubmit = useCallback(
    (data) => {
      console.log('onSubmit triggered with data:', data);
      setSuccessMessage('');
      setErrorMessage('');

      const recipeData = {
        name: data.name || '',
        description: data.description || '',
        price: parseInt(data.price, 10) || 0,
        cookingTime: data.cookingTime || '',
        servings: data.servings || '',
        ingredients: ingredients.filter(ingredient => ingredient.trim() !== ''),
        categoryIds: selectedCategories,
        imageUrls: imageUrls.filter(url => url.trim() !== ''),
        updatedAt: new Date().toISOString(),
      };

      console.log('Updating recipe with data:', recipeData);

      updateRecipe.mutate(
        { id, data: recipeData },
        {
          onSuccess: () => {
            console.log('Recipe update successful');
            const validSteps = recipeSteps.filter(step => step.id && step.tutorial.trim() !== '');
            const totalSteps = validSteps.length;

            if (totalSteps === 0) {
              console.log('No valid steps to update, setting success message and navigating');
              setSuccessMessage('Cập nhật công thức thành công!');
              handleNavigation();
              return;
            }

            console.log(`Updating ${totalSteps} steps`);
            let stepsUpdated = 0;
            validSteps.forEach((step, index) => {
              const stepData = {
                step: parseInt(step.step, 10) || index + 1,
                tutorial: step.tutorial || '',
                duration: parseInt(step.duration, 10) * 60 || 0,
                imageUrls: step.imageUrls.filter(url => url.trim() !== ''),
                recipeId: id,
              };
              console.log(`Updating step ${index + 1} with data:`, stepData);
              updateStep.mutate(
                { stepId: step.id, stepData },
                {
                  onSuccess: () => {
                    stepsUpdated++;
                    console.log(`Step ${index + 1} updated successfully, stepsUpdated: ${stepsUpdated}/${totalSteps}`);
                    if (stepsUpdated === totalSteps) {
                      console.log('All steps updated, setting success message and navigating');
                      setSuccessMessage('Cập nhật công thức và các bước thành công!');
                      handleNavigation();
                    }
                  },
                  onError: (error) => {
                    console.error('Step update error:', error);
                    setErrorMessage('Lỗi khi cập nhật bước: ' + (error.message || 'Unknown error'));
                  },
                }
              );
            });
          },
          onError: (error) => {
            console.error('Recipe update error:', error);
            setErrorMessage('Lỗi khi cập nhật công thức: ' + (error.message || 'Unknown error'));
          },
        }
      );
    },
    [ingredients, selectedCategories, imageUrls, recipeSteps, updateRecipe, updateStep, id, handleNavigation]
  );

  const goBack = useCallback(() => {
    console.log('goBack triggered, navigating back');
    navigate(-1);
  }, [navigate]);

  if (isLoading || isStepsLoading) return <Loading />;
  if (error || !recipe || stepsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-red-600 rounded-3xl p-6 text-center font-semibold text-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Không thể tải thông tin công thức hoặc hướng dẫn!</h2>
          <p className="text-gray-600">Error: {error?.message || stepsError?.message || 'No data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-gray-800 px-4 py-12 pt-24 md:ml-[250px]">
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
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm mb-10">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <button
            onClick={goBack}
            className="group flex items-center px-4 py-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            <FiArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Quay lại</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
              <div className="relative z-10">
                <h1 className="text-4xl font-bold mb-4 leading-tight">Chỉnh sửa: {recipe.name}</h1>
                <p className="text-white/90 text-lg">Cập nhật thông tin công thức của bạn</p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 space-y-8"
        >
          {/* Basic Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full mr-4">
                <FiTag className="text-white" />
              </div>
              Thông tin cơ bản
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên công thức <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: 'Tên công thức là bắt buộc' })}
                  className={`w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder="Nhập tên công thức"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  {...register('description', { required: 'Mô tả là bắt buộc' })}
                  className={`w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${errors.description ? 'border-red-300' : 'border-gray-200'}`}
                  placeholder="Mô tả công thức của bạn"
                />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Giá (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('price', {
                      required: 'Giá là bắt buộc',
                      min: { value: 0, message: 'Giá phải lớn hơn 0' },
                    })}
                    className={`w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${errors.price ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="0"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Thời gian nấu <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('cookingTime', { required: 'Thời gian nấu là bắt buộc' })}
                    className={`w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${errors.cookingTime ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="Ví dụ: 30 phút"
                  />
                  {errors.cookingTime && <p className="mt-1 text-sm text-red-500">{errors.cookingTime.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Khẩu phần <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('servings', { required: 'Khẩu phần là bắt buộc' })}
                    className={`w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${errors.servings ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="Ví dụ: 4 người"
                  />
                  {errors.servings && <p className="mt-1 text-sm text-red-500">{errors.servings.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full mr-4">
                <FiTag className="text-white" />
              </div>
              Hình ảnh
            </h2>
            <div className="space-y-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...imageUrls];
                      newUrls[index] = e.target.value;
                      setImageUrls(newUrls);
                    }}
                    placeholder={`Link hình ảnh ${index + 1}`}
                    className={`flex-1 px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${errors.imageUrls ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== index))}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-300 transform hover:scale-110"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setImageUrls(prev => [...prev, ''])}
                className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <FiPlus className="h-5 w-5" />
                <span className="font-medium">Thêm hình ảnh</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {imageUrls.map((url, index) => (
                url && /\.(jpg|jpeg|png|gif)$/i.test(url) ? (
                  <img
                    key={index}
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-50 object-cover rounded-xl border border-gray-200 shadow-sm hover:scale-105 transition-all duration-200"
                    onError={(e) => {
                      e.target.src = placeholderImages[index % placeholderImages.length];
                    }}
                  />
                ) : (
                  <div
                    key={index}
                    className="w-full h-24 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 text-gray-500"
                  >
                    <div className="text-center">
                      <FiUpload className="mx-auto mb-2 text-2xl" />
                      <p className="text-sm">Không có hình ảnh</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-full mr-4">
                <FiTag className="text-white" />
              </div>
              Danh mục
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const categoryId = category._id || category.id;
                const isSelected = selectedCategories.includes(categoryId);
                return (
                  <label
                    key={categoryId}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 transform hover:scale-105 ${isSelected ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-500'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryChange(categoryId)}
                      className="hidden"
                    />
                    {category.name}
                  </label>
                );
              })}
              {categories.length === 0 && (
                <span className="text-gray-500">Chưa có danh mục</span>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-full mr-4">
                <FiTag className="text-white" />
              </div>
              Nguyên liệu
            </h2>
            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    placeholder={`Nguyên liệu ${index + 1}`}
                    className="flex-1 px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 border-gray-200"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-300 transform hover:scale-110"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <FiPlus className="h-5 w-5" />
                <span className="font-medium">Thêm nguyên liệu</span>
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full mr-4">
                <FiAward className="text-white" />
              </div>
              Hướng dẫn nấu ăn
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 space-y-5">
              {recipeSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start gap-6 bg-white/70 rounded-2xl p-4 shadow hover:bg-white transition-all duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Hướng dẫn <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={step.tutorial}
                        onChange={(e) => updateStepField(index, 'tutorial', e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 border-gray-200"
                        placeholder={`Hướng dẫn cho bước ${index + 1}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Thời lượng (phút)
                      </label>
                      <input
                        type="number"
                        value={step.duration}
                        onChange={(e) => updateStepField(index, 'duration', e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 border-gray-200"
                        placeholder="Ví dụ: 60"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Hình ảnh bước
                      </label>
                      {step.imageUrls.map((url, imageIndex) => (
                        <div key={imageIndex} className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-3">
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => updateStepImage(index, imageIndex, e.target.value)}
                              className="flex-1 px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 border-gray-200"
                              placeholder={`Link hình ảnh ${imageIndex + 1}`}
                            />
                            {step.imageUrls.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeStepImage(index, imageIndex)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-300 transform hover:scale-110"
                              >
                                <FiX className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                          {url && /\.(jpg|jpeg|png|gif)$/i.test(url) ? (
                            <img
                              src={url}
                              alt={`Preview for step ${index + 1}, image ${imageIndex + 1}`}
                              className="w-full h-100 object-cover rounded-xl border border-gray-200 shadow-sm"
                              onError={(e) => {
                                e.target.src = placeholderImages[imageIndex % placeholderImages.length];
                              }}
                            />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 text-gray-500">
                              <div className="text-center">
                                <FiUpload className="mx-auto mb-2 text-2xl" />
                                <p className="text-sm">Không có hình ảnh</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addStepImage(index)}
                        className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <FiPlus className="h-5 w-5" />
                        <span className="font-medium">Thêm hình ảnh</span>
                      </button>
                    </div>
                    {recipeSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="flex items-center space-x-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <FiX className="h-5 w-5" />
                        <span className="font-medium">Xóa bước</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <FiPlus className="h-5 w-5" />
                <span className="font-medium">Thêm bước</span>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={goBack}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-full font-semibold hover:bg-gray-200 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateRecipe.isLoading || updateStep.isLoading}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:from-amber-300 disabled:to-orange-300 disabled:cursor-not-allowed"
            >
              {updateRecipe.isLoading || updateStep.isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              ) : (
                <FiSave className="h-5 w-5" />
              )}
              <span>{updateRecipe.isLoading || updateStep.isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeEdit;