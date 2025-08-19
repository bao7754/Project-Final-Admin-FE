import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX, FiPlus, FiTag, FiAward, FiUpload, FiMove, FiCamera, FiTrash2, FiVideo } from 'react-icons/fi';
import { useRecipe, useUpdateRecipe, useRecipeSteps, useUpdateStep, useAddStep } from '../../hooks/useRecipes';
import { useCategories } from '../../hooks/useCategories';
import { useUploadImage } from '../../hooks/useUploadImage';
import Loading from '../../components/Loading';

const RecipeEdit = () => {
  const { id } = useParams(); // Lấy ID công thức
  const navigate = useNavigate();
  
  // Các hooks API để lấy dữ liệu
  const { data: recipe, isLoading, error } = useRecipe(id); // Lấy thông tin công thức
  const { data: categories = [] } = useCategories(); // Lấy danh sách danh mục
  const { data: steps = [], isLoading: isStepsLoading, error: stepsError } = useRecipeSteps(id); // Lấy các bước nấu
  
  // Các hooks API để thay đổi dữ liệu (tạo/sửa/xóa)
  const updateRecipe = useUpdateRecipe(); // Cập nhật công thức
  const updateStep = useUpdateStep(); // Cập nhật bước nấu
  const addStepMutation = useAddStep(); // Thêm bước nấu mới
  const uploadImageMutation = useUploadImage(); // Upload ảnh/video

  const recipeMediaInputRefs = useRef({}); // Tham chiếu các input upload media của công thức
  const stepMediaInputRefs = useRef({}); // Tham chiếu các input upload media của từng bước

  const [ingredients, setIngredients] = useState(['']); // Danh sách nguyên liệu
  const [selectedCategories, setSelectedCategories] = useState([]); // Danh mục được chọn
  const [imageUrls, setImageUrls] = useState(['']); // Danh sách URL ảnh/video công thức
  const [recipeSteps, setRecipeSteps] = useState([]); // Danh sách các bước nấu
  const [successMessage, setSuccessMessage] = useState(''); // Thông báo thành công
  const [errorMessage, setErrorMessage] = useState(''); // Thông báo lỗi
  const [draggedIndex, setDraggedIndex] = useState(null); // Chỉ số bước đang được kéo
  
  // Thêm state cho validation error danh mục
  const [categoryError, setCategoryError] = useState('');

  const [uploadingRecipeMedia, setUploadingRecipeMedia] = useState({}); // Trạng thái upload media công thức
  const [uploadingStepMedia, setUploadingStepMedia] = useState({}); // Trạng thái upload media từng bước

  const {
    register, // Đăng ký trường nhập liệu
    handleSubmit, // Xử lý submit form
    formState: { errors }, // Lỗi validation
    setValue, // Đặt giá trị cho trường
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      cookingTime: '',
      servings: '',
    },
  });
  const placeholderImages = [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
  ];
  // Kiểm tra URL có phải file video không
  const isVideoFile = useCallback((url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  }, []);

  // Kiểm tra URL có phải file ảnh không
  const isImageFile = useCallback((url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  }, []);

  // Kiểm tra file media có hợp lệ không (kích thước, định dạng)
  const validateMediaFile = useCallback((file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB tối đa
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!file) {
      return { isValid: false, error: 'Vui lòng chọn file' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP) và video (MP4, WebM, OGG, MOV, AVI)' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File quá lớn. Vui lòng chọn file nhỏ hơn 50MB' };
    }

    return { isValid: true };
  }, []);
  
  // Component để preview ảnh và video
  const MediaPreview = useCallback(({ url, alt, className, onError, isRecipeMedia = false }) => {
    if (!url) return null;

    // Kích thước khác nhau cho media công thức và media bước
    const baseClasses = isRecipeMedia 
      ? "w-full h-80 sm:h-96 lg:h-[500px]" // Media công thức - kích thước lớn
      : "w-full h-64 sm:h-72 lg:h-80"; // Media bước - kích thước trung bình

    if (isVideoFile(url)) {
      return (
        <video
          src={url}
          alt={alt}
          className={`${baseClasses} ${className} object-cover rounded-xl shadow-lg`}
          controls
          preload="metadata"
          onError={onError}
        />
      );
    } else if (isImageFile(url)) {
      return (
        <img
          src={url}
          alt={alt}
          className={`${baseClasses} ${className} object-cover rounded-xl shadow-lg`}
          onError={onError}
        />
      );
    }
    
    return (
      <div className={`${baseClasses} ${className} bg-gray-200 flex items-center justify-center text-gray-500 rounded-xl`}>
        <span>Preview không khả dụng</span>
      </div>
    );
  }, [isVideoFile, isImageFile]);

  // Trích xuất ID danh mục từ dữ liệu
  const extractCategoryIds = useCallback((categoryData) => {
    if (!categoryData || !Array.isArray(categoryData)) return [];
    return categoryData
      .map(item => (typeof item === 'object' && item !== null ? item._id || item.id : item))
      .filter(Boolean);
  }, []);
  
  // Effect để đặt giá trị form khi có dữ liệu công thức
  useEffect(() => {
    if (!recipe) return;
    setValue('name', recipe.name || '');
    setValue('description', recipe.description || '');
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

  // Effect để đặt các bước nấu khi có dữ liệu steps
  useEffect(() => {
    if (steps?.length > 0) {
      setRecipeSteps(
        steps
          .sort((a, b) => a.step - b.step) // Sắp xếp theo thứ tự bước
          .map(step => ({
            id: step._id || step.id,
            step: step.step || '',
            tutorial: step.tutorial || '',
            duration: step.duration ? String(Math.round(step.duration / 60)) : '', // Chuyển đổi từ giây sang phút
            imageUrls: step.imageUrls?.length > 0 ? step.imageUrls : [''],
            isNew: false, // Đánh dấu là bước đã tồn tại
          }))
      );
    } else {
      // Nếu chưa có bước nào, tạo bước đầu tiên mặc định
      setRecipeSteps([{
        id: null,
        step: '1',
        tutorial: '',
        duration: '',
        imageUrls: [''],
        isNew: true // Đánh dấu là bước mới
      }]);
    }
  }, [steps]);
  // Effect để đặt lại các bước nấu khi có công thức mới
  const handleRecipeMediaUpload = useCallback(async (index, file) => {
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const uploadKey = `recipe-${index}`;
    setUploadingRecipeMedia(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const formData = new FormData();
      formData.append('files', file);
      const response = await uploadImageMutation.mutateAsync(formData);
      // Xử lý phản hồi để lấy URL - thử nhiều cách khác nhau vì API có thể trả về format khác nhau
      let mediaUrl = null;
      console.log('Cấu trúc response thô:', response);

      if (Array.isArray(response) && response.length > 0 && response[0].url) {
        mediaUrl = response[0].url;
      }
      else if (response?.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].url) {
        mediaUrl = response.data[0].url;
      }
      else if (response?.data?.imageUrl) {
        mediaUrl = response.data.imageUrl;
      } else if (response?.data?.url) {
        mediaUrl = response.data.url;
      } else if (response?.imageUrl) {
        mediaUrl = response.imageUrl;
      } else if (response?.url) {
        mediaUrl = response.url;
      } else if (typeof response === 'string') {
        mediaUrl = response;
      }

      if (!mediaUrl) {
        console.error('Không có media URL trong response:', response);
        throw new Error('Không nhận được URL từ server');
      }

      // Cập nhật state imageUrls
      setImageUrls(prev => {
        const newUrls = [...prev];
        newUrls[index] = mediaUrl;
        return newUrls;
      });

      setSuccessMessage('Upload thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Lỗi upload:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
      setErrorMessage(`Lỗi upload: ${errorMsg}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUploadingRecipeMedia(prev => ({ ...prev, [uploadKey]: false }));
    }
  }, [uploadImageMutation, validateMediaFile]);

  // Xử lý upload media cho từng bước
  const handleStepMediaUpload = useCallback(async (stepIndex, imageIndex, file) => {
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const uploadKey = `step-${stepIndex}-${imageIndex}`;
    setUploadingStepMedia(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const formData = new FormData();
      formData.append('files', file);

      console.log(' Đang upload media bước:', file.name, file.type, file.size);

      const response = await uploadImageMutation.mutateAsync(formData);

      console.log(' Kết quả upload:', response);

      // Xử lý response để lấy URL (tương tự như recipe media)
      let mediaUrl = null;
      console.log('Cấu trúc response thô:', response);

      if (Array.isArray(response) && response.length > 0 && response[0].url) {
        mediaUrl = response[0].url;
      }
      else if (response?.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].url) {
        mediaUrl = response.data[0].url;
      }
      else if (response?.data?.imageUrl) {
        mediaUrl = response.data.imageUrl;
      } else if (response?.data?.url) {
        mediaUrl = response.data.url;
      } else if (response?.imageUrl) {
        mediaUrl = response.imageUrl;
      } else if (response?.url) {
        mediaUrl = response.url;
      } else if (typeof response === 'string') {
        mediaUrl = response;
      }

      if (!mediaUrl) {
        console.error('Không có media URL trong response:', response);
        throw new Error('Không nhận được URL từ server');
      }

      // Cập nhật imageUrls của bước
      setRecipeSteps(prev => {
        const copy = [...prev];
        const imageUrls = [...copy[stepIndex].imageUrls];
        imageUrls[imageIndex] = mediaUrl;
        copy[stepIndex] = { ...copy[stepIndex], imageUrls };
        return copy;
      });

      setSuccessMessage('Upload thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Lỗi upload:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
      setErrorMessage(`Lỗi upload: ${errorMsg}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUploadingStepMedia(prev => ({ ...prev, [uploadKey]: false }));
    }
  }, [uploadImageMutation, validateMediaFile]);

  // ========== XỬ LÝ KÉO THẢ ==========
  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newSteps = [...recipeSteps];
    const draggedStep = newSteps[draggedIndex];

    // Xóa bước ở vị trí cũ và thêm vào vị trí mới
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(dropIndex, 0, draggedStep);

    // Cập nhật lại số thứ tự bước
    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      step: (index + 1).toString()
    }));

    setRecipeSteps(reorderedSteps);
    setDraggedIndex(null);
  }, [draggedIndex, recipeSteps]);

  // ========== XỬ LÝ NGUYÊN LIỆU ==========
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

  // ========== XỬ LÝ CÁC BƯỚC NẤU ==========
  const addStep = useCallback(() => {
    setRecipeSteps(prev => [
      ...prev,
      {
        id: null,
        step: (prev.length + 1).toString(),
        tutorial: '',
        duration: '',
        imageUrls: [''],
        isNew: true
      },
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

  const updateStepImageUrl = useCallback((stepIndex, imageIndex, value) => {
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
          : [''], // Luôn giữ ít nhất 1 trường ảnh trống
      };
      return copy;
    });
  }, []);

  // ========== XỬ LÝ DANH MỤC ==========
  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId];
      
      // Xóa lỗi validation khi có danh mục được chọn
      if (newCategories.length > 0) {
        setCategoryError('');
      }
      
      return newCategories;
    });
  }, []);

  // ========== XỬ LÝ ĐIỀU HƯỚNG ==========
  const handleNavigation = useCallback(() => {
    console.log('Đang cố gắng điều hướng đến /recipes');
    try {
      navigate('/recipes');
      console.log('Điều hướng đến /recipes đã được kích hoạt');
      setSuccessMessage('');
    } catch (err) {
      console.error('Lỗi điều hướng:', err);
      setErrorMessage('Lỗi khi chuyển hướng: ' + (err.message || 'Lỗi không xác định'));
    }
  }, [navigate]);

  // ========== XỬ LÝ SUBMIT FORM ==========
  const onSubmit = useCallback(
    (data) => {
      console.log('=== BẮT ĐẦU SUBMIT ===');
      console.log('Dữ liệu form:', data);
      console.log('RecipeSteps hiện tại:', recipeSteps);
      console.log('Selected categories:', selectedCategories);

      setSuccessMessage('');
      setErrorMessage('');
      setCategoryError('');

      // Kiểm tra danh mục bắt buộc
      if (selectedCategories.length === 0) {
        setCategoryError('Vui lòng chọn ít nhất một danh mục');
        setErrorMessage('Vui lòng chọn ít nhất một danh mục');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      // Chuẩn bị dữ liệu công thức
      const recipeData = {
        name: data.name || '',
        description: data.description || '',
        price: null,
        cookingTime: data.cookingTime || '',
        servings: data.servings || '',
        ingredients: ingredients.filter(ingredient => ingredient.trim() !== ''),
        categoryIds: selectedCategories,
        imageUrls: imageUrls.filter(url => url.trim() !== ''),
        updatedAt: new Date().toISOString(),
      };

      console.log('Dữ liệu công thức để cập nhật:', recipeData);

      // Cập nhật công thức trước
      updateRecipe.mutate(
        { id, data: recipeData },
        {
          onSuccess: () => {
            console.log('=== CẬP NHẬT CÔNG THỨC THÀNH CÔNG ===');

            // Lọc các bước hợp lệ (có nội dung tutorial)
            const validSteps = recipeSteps.filter(step => {
              const isValid = step.tutorial && step.tutorial.trim() !== '';
              console.log(`Kiểm tra bước - ID: ${step.id}, isNew: ${step.isNew}, hợp lệ: ${isValid}`);
              return isValid;
            });

            console.log(`Tổng số bước hợp lệ: ${validSteps.length}`);

            if (validSteps.length === 0) {
              setSuccessMessage('Cập nhật công thức thành công!');
              handleNavigation();
              return;
            }

            console.log('=== XỬ LÝ CÁC BƯỚC ===');
            let stepsProcessed = 0;

            validSteps.forEach((step, index) => {
              const stepData = {
                step: parseInt(step.step, 10) || index + 1,
                tutorial: step.tutorial || '',
                duration: parseInt(step.duration, 10) * 60 || 0, // Chuyển phút thành giây
                imageUrls: step.imageUrls.filter(url => url.trim() !== ''),
                recipeId: id,
              };

              console.log(`Đang xử lý bước ${index + 1}:`, stepData);

              if (step.id && !step.isNew) {
                // Cập nhật bước đã tồn tại
                console.log(`🔄 CẬP NHẬT bước đã tồn tại ${index + 1} với ID: ${step.id}`);
                updateStep.mutate(
                  { stepId: step.id, stepData },
                  {
                    onSuccess: () => {
                      stepsProcessed++;

                      if (stepsProcessed === validSteps.length) {
                        console.log('🎉 Tất cả bước đã được xử lý thành công');
                        setSuccessMessage('Cập nhật công thức và các bước thành công!');
                        handleNavigation();
                      }
                    },
                    onError: (error) => {
                      setErrorMessage('Lỗi khi cập nhật bước: ' + (error.message || 'Lỗi không xác định'));
                    },
                  }
                );
              } else {
                // Tạo bước mới
                const addStepData = {
                  step: parseInt(step.step, 10) || index + 1,
                  tutorial: step.tutorial || '',
                  recipeId: id,
                  duration: parseInt(step.duration, 10) || 0,
                  imageUrls: step.imageUrls.filter(url => url.trim() !== ''),
                };

                console.log('Tạo bước với dữ liệu:', addStepData);

                addStepMutation.mutate(addStepData, {
                  onSuccess: () => {
                    stepsProcessed++;

                    if (stepsProcessed === validSteps.length) {
                      setSuccessMessage('Cập nhật công thức và tạo bước mới thành công!');
                      handleNavigation();
                    }
                  },
                  onError: (error) => {
                    setErrorMessage('Lỗi khi tạo bước mới: ' + (error.message || 'Lỗi không xác định'));
                  },
                });
              }
            });
          },
          onError: (error) => {
            setErrorMessage('Lỗi khi cập nhật công thức: ' + (error.message || 'Lỗi không xác định'));
          },
        }
      );
    },
    [ingredients, selectedCategories, imageUrls, recipeSteps, updateRecipe, updateStep, addStepMutation, id, handleNavigation]
  );

  const goBack = useCallback(() => {
    console.log('goBack được kích hoạt, đang điều hướng quay lại');
    navigate(-1);
  }, [navigate]);

  // ========== HIỂN THỊ LOADING VÀ ERROR ==========
  if (isLoading || isStepsLoading) return <Loading />;
  if (error || !recipe || stepsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-red-600 rounded-3xl p-6 text-center font-semibold text-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Không thể tải thông tin công thức hoặc hướng dẫn!</h2>
          <p className="text-gray-600">Lỗi: {error?.message || stepsError?.message || 'Không có dữ liệu'}</p>
        </div>
      </div>
    );
  }

  // ========== RENDER GIAO DIỆN ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-gray-800 px-4 py-12 pt-24 md:ml-[250px]">
      {/* Thông báo thành công */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg z-50">
          {successMessage}
        </div>
      )}
      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-xl shadow-lg z-50">
          {errorMessage}
        </div>
      )}
      
      {/* Header với nút quay lại */}
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
        {/* Tiêu đề */}
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

        {/* Form chính */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 space-y-8"
        >
          {/* ========== THÔNG TIN CƠ BẢN ========== */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full mr-4">
                <FiTag className="text-white" />
              </div>
              Thông tin cơ bản
            </h2>
            <div className="space-y-4">
              {/* Tên công thức */}
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
              
              {/* Mô tả */}
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
              
              {/* Thời gian nấu và Khẩu phần */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Thời gian nấu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('cookingTime', {
                      required: 'Thời gian nấu là bắt buộc',
                      min: { value: 1, message: 'Thời gian nấu phải lớn hơn hoặc bằng 1 phút' },
                      valueAsNumber: true
                    })}
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
                    type="number"
                    min="1"
                    {...register('servings', {
                      required: 'Khẩu phần là bắt buộc',
                      min: { value: 1, message: 'Khẩu phần phải lớn hơn hoặc bằng 1' },
                      valueAsNumber: true
                    })}
                    className={`w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${errors.servings ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="Ví dụ: 4 người"
                  />
                  {errors.servings && <p className="mt-1 text-sm text-red-500">{errors.servings.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* ========== MEDIA CÔNG THỨC (ẢNH VÀ VIDEO) ========== */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full mr-4">
                <FiCamera className="text-white" />
              </div>
              Hình ảnh và Video công thức
            </h2>
            <div className="space-y-6">
              {imageUrls.map((url, index) => {
                const uploadKey = `recipe-${index}`;
                const isUploading = uploadingRecipeMedia[uploadKey];

                return (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-lg font-semibold text-gray-700 flex items-center">
                        {isVideoFile(url) ? (
                          <FiVideo className="mr-3 h-6 w-6 text-blue-500" />
                        ) : (
                          <FiCamera className="mr-3 h-6 w-6 text-green-500" />
                        )}
                        Media {index + 1} {isVideoFile(url) ? '(Video)' : isImageFile(url) ? '(Ảnh)' : ''}
                      </label>
                      {/* Nút xóa media (chỉ hiển thị khi có nhiều hơn 1) */}
                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== index))}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-300 transform hover:scale-110"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Input file và URL */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => handleRecipeMediaUpload(index, e.target.files[0])}
                          className="hidden"
                          ref={el => recipeMediaInputRefs.current[`recipe-${index}`] = el}
                        />
                        <button
                          type="button"
                          onClick={() => recipeMediaInputRefs.current[`recipe-${index}`]?.click()}
                          disabled={isUploading}
                          className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 disabled:from-amber-300 disabled:to-orange-300 shadow-lg"
                        >
                          <FiUpload className="h-5 w-5" />
                          <span className="font-medium">{isUploading ? 'Đang tải...' : 'Chọn file'}</span>
                        </button>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...imageUrls];
                            newUrls[index] = e.target.value;
                            setImageUrls(newUrls);
                          }}
                          placeholder="Hoặc dán link ảnh/video"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 bg-white"
                        />
                      </div>

                      {/* Thanh tiến trình upload */}
                      {isUploading && (
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full animate-pulse shadow-sm"></div>
                        </div>
                      )}

                      {/* Preview media */}
                      {url && (isImageFile(url) || isVideoFile(url)) && (
                        <div className="relative bg-white rounded-xl p-2 shadow-lg">
                          <MediaPreview
                            url={url}
                            alt={`Recipe Preview ${index + 1}`}
                            className="border-2 border-gray-100"
                            isRecipeMedia={true}
                            onError={(e) => {
                              // Nếu lỗi load ảnh, sử dụng ảnh placeholder
                              if (isImageFile(url)) {
                                e.target.src = placeholderImages[index % placeholderImages.length];
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Nút thêm media */}
              <button
                type="button"
                onClick={() => setImageUrls(prev => [...prev, ''])}
                className="flex items-center space-x-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-dashed border-amber-300 hover:border-amber-400"
              >
                <FiPlus className="h-6 w-6" />
                <span className="font-semibold text-lg">Thêm media</span>
              </button>
            </div>
          </div>

          {/* ========== DANH MỤC ========== */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-full mr-4">
                <FiTag className="text-white" />
              </div>
              Danh mục
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn danh mục <span className="text-red-500">*</span>
            </label>
            <div className={`flex flex-wrap gap-3 p-4 border rounded-xl transition-all duration-300 ${categoryError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              {categories.map((category) => {
                const categoryId = category._id || category.id;
                const isSelected = selectedCategories.includes(categoryId);
                return (
                  <label
                    key={categoryId}
                    className={`flex items-center px-6 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-md ${isSelected ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-500'}`}
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
                <span className="text-gray-500 italic">Chưa có danh mục</span>
              )}
            </div>
            {/* Hiển thị lỗi validation danh mục */}
            {categoryError && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {categoryError}
              </p>
            )}
          </div>

          {/* ========== NGUYÊN LIỆU ========== */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-full mr-4">
                <FiTag className="text-white" />
              </div>
              Nguyên liệu
            </h2>
            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-4 bg-gray-50 rounded-xl p-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex-shrink-0"></div>
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    placeholder={`Nguyên liệu ${index + 1}`}
                    className="flex-1 px-4 py-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 border-gray-200"
                  />
                  {/* Nút xóa nguyên liệu (chỉ hiển thị khi có nhiều hơn 1) */}
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
              {/* Nút thêm nguyên liệu */}
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center space-x-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-dashed border-amber-300 hover:border-amber-400"
              >
                <FiPlus className="h-6 w-6" />
                <span className="font-semibold">Thêm nguyên liệu</span>
              </button>
            </div>
          </div>

          {/* ========== CÁC BƯỚC NẤU ĂN ========== */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full mr-4">
                <FiAward className="text-white" />
              </div>
              Hướng dẫn nấu ăn
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 space-y-6">
              {recipeSteps.map((step, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`flex flex-col lg:flex-row items-start gap-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:bg-white transition-all duration-300 cursor-move border border-white/50 ${draggedIndex === index ? 'opacity-50 transform scale-95' : ''}`}
                >
                  {/* Header bước với số thứ tự */}
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <div className="cursor-move text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all duration-300">
                      <FiMove className="h-6 w-6" />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      {index + 1}
                    </div>
                    {/* Badge "Mới" cho bước mới */}
                    {step.isNew && (
                      <span className="bg-green-100 text-green-600 text-sm px-3 py-1 rounded-full font-medium shadow-sm">
                        Mới
                      </span>
                    )}
                  </div>

                  {/* Nội dung bước */}
                  <div className="flex-1 space-y-4">
                    {/* Hướng dẫn */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hướng dẫn <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={step.tutorial}
                        onChange={(e) => updateStepField(index, 'tutorial', e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 border-gray-200 shadow-sm"
                        placeholder={`Hướng dẫn chi tiết cho bước ${index + 1}`}
                      />
                    </div>
                    
                    {/* Thời lượng */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời lượng (phút)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={step.duration}
                        onChange={(e) => updateStepField(index, 'duration', e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 border-gray-200 shadow-sm"
                        placeholder="Ví dụ: 5"
                      />
                    </div>

                    {/* Media bước (Ảnh và Video) */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Media bước (Ảnh/Video)
                      </label>
                      {step.imageUrls.map((url, imageIndex) => {
                        const uploadKey = `step-${index}-${imageIndex}`;
                        const isUploading = uploadingStepMedia[uploadKey];

                        return (
                          <div key={imageIndex} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-600 flex items-center">
                                {isVideoFile(url) ? (
                                  <FiVideo className="mr-2 h-4 w-4 text-blue-500" />
                                ) : (
                                  <FiCamera className="mr-2 h-4 w-4 text-green-500" />
                                )}
                                Media {imageIndex + 1} {isVideoFile(url) ? '(Video)' : isImageFile(url) ? '(Ảnh)' : ''}
                              </span>
                              {/* Nút xóa media bước (chỉ hiển thị khi có nhiều hơn 1) */}
                              {step.imageUrls.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeStepImage(index, imageIndex)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-300 transform hover:scale-110"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            <div className="space-y-3">
                              {/* Input file và URL */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  onChange={(e) => handleStepMediaUpload(index, imageIndex, e.target.files[0])}
                                  className="hidden"
                                  ref={el => {
                                    if (!stepMediaInputRefs.current[`${index}-${imageIndex}`]) {
                                      stepMediaInputRefs.current[`${index}-${imageIndex}`] = el;
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => stepMediaInputRefs.current[`${index}-${imageIndex}`]?.click()}
                                  disabled={isUploading}
                                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:bg-blue-300 shadow-sm transform hover:scale-105"
                                >
                                  <FiUpload className="h-4 w-4" />
                                  <span>{isUploading ? 'Đang tải...' : 'Chọn file'}</span>
                                </button>
                                <input
                                  type="url"
                                  value={url}
                                  onChange={(e) => updateStepImageUrl(index, imageIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                  placeholder="Hoặc dán link media"
                                />
                              </div>

                              {/* Thanh tiến trình upload */}
                              {isUploading && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="bg-blue-500 h-2 rounded-full animate-pulse shadow-sm"></div>
                                </div>
                              )}

                              {/* Preview media */}
                              {url && (isImageFile(url) || isVideoFile(url)) && (
                                <div className="relative bg-gray-50 rounded-lg p-2">
                                  <MediaPreview
                                    url={url}
                                    alt={`Step ${index + 1} - Media ${imageIndex + 1}`}
                                    className="border border-gray-200"
                                    isRecipeMedia={false}
                                    onError={(e) => {
                                      // Nếu lỗi load ảnh, sử dụng ảnh placeholder
                                      if (isImageFile(url)) {
                                        e.target.src = placeholderImages[imageIndex % placeholderImages.length];
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Nút thêm media cho bước */}
                      <button
                        type="button"
                        onClick={() => addStepImage(index)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-300 text-sm border border-dashed border-blue-300 hover:border-blue-400 transform hover:scale-105"
                      >
                        <FiPlus className="h-4 w-4" />
                        <span className="font-medium">Thêm media</span>
                      </button>
                    </div>

                    {/* Nút xóa bước (chỉ hiển thị khi có nhiều hơn 1 bước) */}
                    {recipeSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="flex items-center space-x-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 border border-red-200 hover:border-red-300"
                      >
                        <FiX className="h-5 w-5" />
                        <span className="font-medium">Xóa bước</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Nút thêm bước */}
              <button
                type="button"
                onClick={addStep}
                className="flex items-center space-x-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-dashed border-amber-300 hover:border-amber-400"
              >
                <FiPlus className="h-6 w-6" />
                <span className="font-semibold">Thêm bước</span>
              </button>
            </div>
          </div>

          {/* ========== NÚT SUBMIT ========== */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8">
            <button
              type="button"
              onClick={goBack}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-full font-semibold hover:bg-gray-200 transition-all duration-300 shadow-lg transform hover:scale-105 border border-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateRecipe.isLoading || updateStep.isLoading || addStepMutation.isLoading}
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:from-amber-300 disabled:to-orange-300 disabled:cursor-not-allowed disabled:transform-none"
            >
              {/* Icon loading hoặc save */}
              {updateRecipe.isLoading || updateStep.isLoading || addStepMutation.isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              ) : (
                <FiSave className="h-5 w-5" />
              )}
              <span>{updateRecipe.isLoading || updateStep.isLoading || addStepMutation.isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipeEdit;