import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FiStar, FiUser, FiCalendar, FiMessageSquare, FiTrash2, FiImage, FiFilter } from 'react-icons/fi';
import { useReviews, useDeleteReview, useGetRecipeId, useRecipes } from '../../hooks/useRecipes';
import Loading from '../../components/Loading';

// Avatar component with fallback
const UserAvatar = React.memo(({ user, size = 12 }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const sizeClass = `h-${size} w-${size}`;
  
  useEffect(() => {
    if (user) {
      let avatarUrl = user.avatar || user.profileImage || user.image || user.photo;
      
      // Xử lý URL Google avatar
      if (avatarUrl && avatarUrl.includes('googleusercontent.com')) {
        // Thử các size khác nhau
        avatarUrl = avatarUrl.replace(/=s\d+-c/, '=s128-c');
      }
      
      setImageSrc(avatarUrl);
      setImageError(false);
    }
  }, [user]);

  const handleImageError = () => {
    setImageError(true);
  };

  const getUserDisplayName = (userId) => {
    if (!userId) return 'Người dùng ẩn danh';
    return userId.fullName || userId.name || 'Người dùng';
  };

  if (!user || !imageSrc || imageError) {
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-orange-200 flex items-center justify-center shadow-md`}>
        <FiUser className={`h-${Math.floor(size/2)} w-${Math.floor(size/2)} text-amber-600`} />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={getUserDisplayName(user)}
      className={`${sizeClass} rounded-full object-cover border-3 border-white shadow-lg`}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={handleImageError}
    />
  );
});

UserAvatar.displayName = 'UserAvatar';
const StarRating = ({ rating, size = 'sm' }) => {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={`${sizeClass} ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('all');

  const { data: reviewsData, isLoading, error } = useReviews();
  const { data: recipesData, isLoading: isLoadingRecipes, error: recipesError } = useRecipes();
  const deleteReview = useDeleteReview();

  // Update reviews when data changes
  useEffect(() => {
    if (reviewsData) {
      const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
      setReviews(reviewsArray);
    } else {
      setReviews([]);
    }
  }, [reviewsData]);

  // Ensure recipesData is an array
  const recipesArray = useMemo(() => {
    if (!recipesData) return [];
    // Adjust this based on your API response structure
    return Array.isArray(recipesData) ? recipesData : recipesData.recipes || [];
  }, [recipesData]);

  // State để lưu tên recipes đã resolve
  const [resolvedRecipeNames, setResolvedRecipeNames] = useState(new Map());

  // Callback để update tên recipe khi resolve xong - memoized properly
  const handleRecipeNameResolve = useCallback((recipeId, recipeName) => {
    setResolvedRecipeNames(prev => {
      // Kiểm tra xem đã có tên này chưa để tránh re-render không cần thiết
      if (prev.has(recipeId) && prev.get(recipeId) === recipeName) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(recipeId, recipeName);
      return newMap;
    });
  }, []);

  // Component để lấy tên recipe từ ID
  const RecipeNameResolver = React.memo(({ recipeId, onResolve }) => {
    const { data: recipe } = useGetRecipeId(recipeId);
    
    React.useEffect(() => {
      if (recipe && recipe.name && !resolvedRecipeNames.has(recipeId)) {
        onResolve(recipeId, recipe.name);
      }
    }, [recipe, recipeId, onResolve]);
    
    return null;
  });

  // Tạo danh sách tất cả recipes (từ API + từ reviews với tên thực)
  const allRecipeOptions = useMemo(() => {
    const recipeMap = new Map();
    
    // Thêm từ recipes API
    recipesArray.forEach(recipe => {
      recipeMap.set(recipe.id, {
        id: recipe.id,
        name: recipe.name,
        source: 'api'
      });
    });
    
    // Thêm từ reviews với tên đã resolve
    reviews.forEach(review => {
      if (review.recipeId && !recipeMap.has(review.recipeId)) {
        const resolvedName = resolvedRecipeNames.get(review.recipeId);
        recipeMap.set(review.recipeId, {
          id: review.recipeId,
          name: resolvedName || `Đang tải tên...`,
          source: 'review'
        });
      }
    });
    
    return Array.from(recipeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipesArray, reviews, resolvedRecipeNames]);

  // Lấy danh sách unique recipe IDs từ reviews để resolve tên - memoized with proper dependencies
  const uniqueReviewRecipeIds = useMemo(() => {
    const ids = new Set();
    reviews.forEach(review => {
      if (review.recipeId && !recipesArray.some(r => r.id === review.recipeId) && !resolvedRecipeNames.has(review.recipeId)) {
        ids.add(review.recipeId);
      }
    });
    return Array.from(ids);
  }, [reviews, recipesArray, resolvedRecipeNames]);

  // Handle delete review
  const handleDeleteReview = useCallback(
    async (reviewId) => {
      if (!window.confirm('Bạn có chắc muốn xóa đánh giá này không?')) {
        return;
      }

      try {
        await deleteReview.mutateAsync(reviewId);
        setReviews((prevReviews) =>
          prevReviews.filter((review) => review.id !== reviewId)
        );
      } catch (error) {
        alert(
          `Có lỗi xảy ra khi xóa đánh giá: ${
            error.message || 'Vui lòng thử lại.'
          }`
        );
      }
    },
    [deleteReview]
  );

  // Sort and filter reviews
  const sortedReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return [];
    }

    let filteredReviews = [...reviews];

    if (selectedRecipeId !== 'all') {
      filteredReviews = filteredReviews.filter(
        (review) => review.recipeId === selectedRecipeId
      );
    }

    return filteredReviews.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [reviews, selectedRecipeId]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-8 bg-red-50 rounded-lg mx-4">
        <div className="font-semibold mb-2">Có lỗi xảy ra khi tải dữ liệu</div>
        <div className="text-sm">{error.message}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const hasReviews = sortedReviews && sortedReviews.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pl-72">
      {/* Hidden components để resolve tên recipes từ reviews */}
      <div style={{ display: 'none' }}>
        {uniqueReviewRecipeIds.map(recipeId => (
          <RecipeNameResolver 
            key={recipeId}
            recipeId={recipeId}
            onResolve={handleRecipeNameResolve}
          />
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl mr-4 shadow-lg">
              <FiMessageSquare className="h-8 w-8 text-white" />
            </div>
            Đánh giá từ người dùng
          </h1>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <FiFilter className="h-5 w-5 text-gray-600" />
          <label htmlFor="recipeFilter" className="text-gray-700 font-medium">
            Lọc theo công thức:
          </label>
          <select
            id="recipeFilter"
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-w-[200px]"
          >
            <option value="all">Tất cả công thức</option>
            {isLoadingRecipes ? (
              <option disabled>Đang tải công thức...</option>
            ) : recipesError ? (
              <option disabled>Lỗi tải công thức</option>
            ) : allRecipeOptions.length === 0 ? (
              <option disabled>Không có công thức nào</option>
            ) : (
              allRecipeOptions.map((recipe) => {
                const reviewCount = reviews.filter(r => r.recipeId === recipe.id).length;
                const isLoading = recipe.name === 'Đang tải tên...';
                return (
                  <option key={recipe.id} value={recipe.id} disabled={isLoading}>
                    {recipe.name} ({reviewCount})
                  </option>
                );
              })
            )}
          </select>
        </div>
      </div>

      {/* Results */}
      {!hasReviews ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiMessageSquare className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Chưa có đánh giá nào
          </h3>
          <p className="text-gray-500">
            {selectedRecipeId === 'all'
              ? 'Hãy là người đầu tiên chia sẻ đánh giá của bạn!'
              : 'Không có đánh giá nào cho công thức này.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-sm text-gray-600 mb-4">
            Hiển thị {sortedReviews.length} đánh giá
            {selectedRecipeId !== 'all' && ` cho công thức đã chọn`}
          </div>
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={handleDeleteReview}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ReviewCard component - fetch recipe individually
const ReviewCard = React.memo(({ review, onDelete }) => {
  const { data: recipe, isLoading: isLoadingRecipe, error: recipeError } = useGetRecipeId(review.recipeId);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserDisplayName = (userId) => {
    if (!userId) return 'Người dùng ẩn danh';
    return userId.fullName || userId.name || 'Người dùng';
  };

  const displayRecipeName = () => {
    if (isLoadingRecipe) return 'Đang tải tên công thức...';
    if (recipeError) {
      if (recipeError.message?.includes('404') || recipeError.status === 404) {
        return `Công thức đã bị xóa (ID: ${review.recipeId})`;
      }
      return `Lỗi tải công thức (ID: ${review.recipeId})`;
    }
    return recipe?.name || `Công thức ${review.recipeId}`;
  };

  const recipeImage = recipe?.imageUrls?.[0] || recipe?.image || recipe?.images?.[0];

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Header with user info */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <UserAvatar user={review.userId} size={12} />
            </div>

            {/* User info */}
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {getUserDisplayName(review.userId)}
              </h3>
              <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                <div className="flex items-center space-x-1">
                  <FiCalendar className="h-4 w-4" />
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Rating */}
            <div className="text-center">
              <StarRating rating={review.rating} />
              <span className="text-sm font-bold text-gray-700 mt-1 block">
                {review.rating}/5
              </span>
            </div>

            {/* Delete button */}
            <button
              onClick={() => onDelete(review.id)}
              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 group"
              title="Xóa đánh giá"
            >
              <FiTrash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border-l-4 border-amber-400">
              <p className="text-gray-700 leading-relaxed text-lg italic font-medium">
                "{review.comment}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recipe section with image */}
      <div className="px-6 pb-6">
        <div className={`rounded-xl p-4 border ${
          recipeError ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="flex items-center space-x-4">
            {/* Recipe Image */}
            <div className="flex-shrink-0">
              {recipeImage && !recipeError ? (
                <img
                  src={recipeImage}
                  alt={displayRecipeName()}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-white shadow-md ${
                  recipeImage && !recipeError ? 'hidden' : 'flex'
                }`}
              >
                {isLoadingRecipe ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                ) : (
                  <FiImage className="h-8 w-8 text-gray-400" />
                )}
              </div>
            </div>

            {/* Recipe Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium mb-1 ${
                recipeError ? 'text-red-800' : 'text-amber-800'
              }`}>
                🍽️ Đánh giá cho món ăn:
              </p>
              <h4 className={`font-bold text-lg truncate transition-colors duration-200 cursor-pointer ${
                recipeError ? 'text-red-700' : 'text-gray-900 hover:text-amber-600'
              }`}>
                {displayRecipeName()}
              </h4>
              {recipeError && (
                <p className="text-xs text-red-600 mt-1">
                  {recipeError.message || 'Có lỗi khi tải thông tin món ăn'}
                </p>
              )}
              {isLoadingRecipe && (
                <p className="text-xs text-amber-600 mt-1">
                  Đang tải thông tin món ăn...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ReviewCard.displayName = 'ReviewCard';

export default Reviews;