import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiClock, FiUsers, FiDollarSign, FiTag, FiEdit, FiArrowLeft,
  FiHeart, FiShare2, FiBookmark, FiAward, FiStar
} from 'react-icons/fi';
import { useRecipe, useGetDetailsRecipe } from '../../hooks/useRecipes';
import { useRecipeSteps } from '../../hooks/useRecipes';
import useAuthStore from '../../store/authStore';
import Loading from '../../components/Loading';

const RecipeDetail = () => {
  const { id } = useParams();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const { user } = useAuthStore();
  const approveMutation = useGetDetailsRecipe();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Lấy danh sách bước hướng dẫn từ API /api/steps/recipe/:idRecipe
  const { data: steps, isLoading: isStepsLoading, error: stepsError } = useRecipeSteps(id);

  if (isLoading) return <Loading />;
  if (error || !recipe)
    return (
      <div className="text-red-600 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Không thể tải thông tin công thức!</h2>
          <p className="text-gray-600">Error: {error?.message || 'No recipe data'}</p>
        </div>
      </div>
    );

  const handleApprove = () => {
    if (id) approveMutation.mutate(id);
  };

  const isAdmin = user?.role === 'admin';
  const needsApproval = !recipe.approvedAt;

  // Placeholder images nếu không có ảnh
  const placeholderImages = [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
  ];

  const getPlaceholderImage = (id) => {
    if (!id) return placeholderImages[0];
    const index = id.charCodeAt(0) % placeholderImages.length;
    return placeholderImages[index];
  };

  const images = recipe.imageUrls?.length > 0 ? recipe.imageUrls : [getPlaceholderImage(recipe._id)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-gray-800 ml-[250px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-4 py-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            <FiArrowLeft className="mr-2" /> Quay lại
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${isLiked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
            >
              <FiHeart className={isLiked ? 'fill-current' : ''} />
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${isBookmarked ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-500'
                }`}
            >
              <FiBookmark className="fill-current" />
            </button>
            <button className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all duration-300 transform hover:scale-110">
              <FiShare2 />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>

              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <FiAward className="text-3xl mr-3" />
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                    {needsApproval ? 'Chờ duyệt' : 'Đã duyệt'}
                  </span>
                </div>
                <h1 className="text-5xl font-bold mb-4 leading-tight">
                  {recipe.name || 'No name'}
                </h1>
                <div className="flex items-center mb-6">
                  <div className="flex items-center mr-6">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className="text-yellow-300 fill-current" />
                    ))}
                    <span className="ml-2 text-sm">4.8 (124 đánh giá)</span>
                  </div>
                  <div className="text-sm">
                    Tạo bởi <span className="font-semibold">Chef Master</span>
                  </div>
                </div>
                <div className="flex space-x-4">
                  {isAdmin && needsApproval && (
                    <button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      className="px-8 py-3 bg-white text-amber-600 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 disabled:opacity-75 shadow-lg transform hover:scale-105"
                    >
                      {approveMutation.isPending ? 'Đang duyệt...' : 'Duyệt công thức'}
                    </button>
                  )}
                  {isAdmin && (
                    <Link to={`/recipes/edit/${recipe._id}`}>
                      <button className="flex items-center px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold hover:bg-white/20 transition-all duration-300 shadow-lg transform hover:scale-105">
                        <FiEdit className="mr-2" /> Chỉnh sửa
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Main Image */}
              <div className="relative">
                <img
                  src={images[selectedImageIndex]}
                  alt={recipe.name || 'Recipe image'}
                  className="w-full h-96 object-cover transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-3">
                    {images.slice(0, 4).map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 ${selectedImageIndex === index ? 'ring-3 ring-amber-500' : ''
                          }`}
                      >
                        <img
                          src={url}
                          alt={`${recipe.name || 'Recipe'} ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        {selectedImageIndex === index && (
                          <div className="absolute inset-0 bg-amber-500/20"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipe Info */}
          <div className="space-y-6">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full mr-3">
                    <FiClock className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Thời gian</p>
                    <p className="font-bold text-lg">{recipe.cookingTime || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-full mr-3">
                    <FiUsers className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Khẩu phần</p>
                    <p className="font-bold text-lg">{recipe.servings || 'N/A'}</p>
                  </div>
                </div>
              </div>

          
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Mô tả</h3>
              <p className="text-gray-600 leading-relaxed">
                {recipe.description || 'Một công thức tuyệt vời để thưởng thức cùng gia đình và bạn bè. Hương vị đậm đà, cách làm đơn giản.'}
              </p>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Danh mục</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.categoryIds?.length > 0 ? (
                  recipe.categoryIds.map((category) => (
                    <span
                      key={category._id || category}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                    >
                      {category.name || category}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Chưa có danh mục</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-full mr-4">
              <FiTag className="text-white" />
            </div>
            Nguyên liệu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipe.ingredients?.length > 0 ? (
              recipe.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mr-4"></div>
                  <span className="text-gray-700 font-medium">{ingredient}</span>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">📝</div>
                <p>Chưa có nguyên liệu nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions Section: LẤY TỪ API STEPS */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full mr-4">
              <FiAward className="text-white" />
            </div>
            Hướng dẫn nấu ăn
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            {isStepsLoading ? (
              <div className="text-amber-600">Đang tải hướng dẫn...</div>
            ) : stepsError ? (
              <div className="text-red-600">Lỗi tải hướng dẫn: {stepsError.message}</div>
            ) : steps?.length > 0 ? (
              <ol className="space-y-5">
                {steps
                  .sort((a, b) => a.step - b.step)
                  .map((step) => (
                    <li
                      key={step._id || step.step}
                      className="flex flex-col sm:flex-row items-start gap-6 bg-white/70 rounded-2xl p-4 shadow hover:bg-white transition-all duration-300"
                    >
                      {/* Số bước tròn trịa */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg mb-2">Bước {step.step}</div>
                        <div className="text-gray-700 text-base mb-2">{step.tutorial}</div>
                        {/* Hình ảnh từng bước */}
                        {Array.isArray(step.imageUrls) && step.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-3 mb-2">
                            {step.imageUrls.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Step ${step.step} - ${idx + 1}`}
                                className="w-32 h-24 object-cover rounded-xl border border-gray-200 shadow hover:scale-105 transition-all duration-200"
                                loading="lazy"
                              />
                            ))}
                          </div>
                        )}
                        {/* Thời gian */}
                        {step.duration > 0 && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FiClock /> Thời gian: {Math.round(step.duration / 60)} phút
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>

            ) : (
              <div className="text-gray-600 italic">Chưa có hướng dẫn nấu ăn cho công thức này.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
