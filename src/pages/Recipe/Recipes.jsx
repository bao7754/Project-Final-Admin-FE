import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiPlus, FiCheckCircle, FiTag, FiUsers, FiClock, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useDeleteRecipe, useRecipes, useDeleteStep } from '../../hooks/useRecipes';
import RecipeFilters from '../../components/RecipeFilters';
import Loading from '../../components/Loading';
import useAuthStore from '../../store/authStore';
import { useApproveRecipe } from '../../hooks/useRecipes';

// Hàm chuyển đổi chuỗi có dấu thành không dấu để hỗ trợ tìm kiếm tiếng Việt
const removeVietnameseAccents = (str) => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/[đ]/g, 'd')
    .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
    .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
    .replace(/[ÌÍỊỈĨ]/g, 'I')
    .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
    .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
    .replace(/[ỲÝỴỶỸ]/g, 'Y')
    .replace(/[Đ]/g, 'D');
};

const Recipes = () => {
  // State quản lý phân trang và bộ lọc
  const [page, setPage] = useState(1); // Trang hiện tại
  const [searchTerm, setSearchTerm] = useState(''); // Từ khóa tìm kiếm
  const [selectedCategory, setSelectedCategory] = useState(''); // Danh mục được chọn
  const [sortBy, setSortBy] = useState('newest'); // Tiêu chí sắp xếp
  const [showApproved, setShowApproved] = useState('all'); // Lọc theo trạng thái duyệt
  const [recipes, setRecipes] = useState([]); // Danh sách công thức

  // Hooks để điều hướng và lấy dữ liệu
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, error } = useRecipes(page);
  const { isAuthenticated } = useAuthStore();
  const approveMutation = useApproveRecipe();
  const deleteRecipe = useDeleteRecipe();
  const deleteRecipeSteps = useDeleteStep();

  // Xử lý khi quay lại từ trang tạo công thức mới
  useEffect(() => {
    if (location.state?.fromCreateRecipe) {
      setPage(1); // Reset về trang đầu
      setShowApproved('all'); // Hiển thị tất cả công thức
      // Xóa state để tránh reset lặp lại
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Cập nhật danh sách công thức khi có dữ liệu mới
  useEffect(() => {
    if (data?.data) {
      setRecipes(data.data);
    } else {
      setRecipes([]);
    }
  }, [data?.data]);

  // Lọc và sắp xếp công thức theo tiêu chí được chọn
  const filteredAndSortedRecipes = useMemo(() => {
    if (!recipes || recipes.length === 0) {
      return [];
    }

    // Bước 1: Lọc công thức theo các tiêu chí
    let filtered = recipes.filter(recipe => {
      // Lọc theo từ khóa tìm kiếm (hỗ trợ tiếng Việt có dấu và không dấu)
      let matchesSearch = true;
      if (searchTerm) {
        const searchTermNormalized = removeVietnameseAccents(searchTerm.toLowerCase());
        const recipeName = removeVietnameseAccents(recipe.name?.toLowerCase() || '');
        const recipeDescription = removeVietnameseAccents(recipe.description?.toLowerCase() || '');
        
        matchesSearch = recipeName.includes(searchTermNormalized) || 
                      recipeDescription.includes(searchTermNormalized);
      }

      // Lọc theo danh mục
      let matchesCategory = true;
      if (selectedCategory) {
        if (recipe.categoryIds && Array.isArray(recipe.categoryIds)) {
          // Xử lý trường hợp categoryIds là mảng các object
          if (recipe.categoryIds.length > 0 && typeof recipe.categoryIds[0] === 'object') {
            matchesCategory = recipe.categoryIds.some(cat =>
              cat.id === selectedCategory || cat._id === selectedCategory || cat.name === selectedCategory
            );
          }
          // Xử lý trường hợp categoryIds là mảng các string
          else {
            matchesCategory = recipe.categoryIds.includes(selectedCategory);
          }
        } else {
          matchesCategory = false;
        }
      }

      // Lọc theo trạng thái duyệt
      const matchesApproval = showApproved === 'all' ||
        (showApproved === 'approved' && recipe.approvedAt) ||
        (showApproved === 'pending' && !recipe.approvedAt);

      return matchesSearch && matchesCategory && matchesApproval;
    });

    // Bước 2: Sắp xếp công thức theo tiêu chí được chọn
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt); // Mới nhất trước
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt); // Cũ nhất trước
        case 'price-low':
          return (a.price || 0) - (b.price || 0); // Giá thấp đến cao
        case 'price-high':
          return (b.price || 0) - (a.price || 0); // Giá cao đến thấp
        case 'name':
          return (a.name || '').localeCompare(b.name || ''); // Sắp xếp theo tên A-Z
        default:
          return 0;
      }
    });

    return filtered;
  }, [recipes, searchTerm, selectedCategory, sortBy, showApproved]);

  // Các hàm xử lý sự kiện
  
  // Xử lý chuyển trang
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu trang mượt mà
  }, []);

  // Xử lý duyệt công thức
  const handleApprove = useCallback((recipeId) => {
    approveMutation.mutate(recipeId, {
      onSuccess: () => {
        // Cập nhật state local để UI phản hồi ngay lập tức
        setRecipes(prevRecipes =>
          prevRecipes.map(recipe =>
            recipe._id === recipeId
              ? { ...recipe, approvedAt: new Date().toISOString() }
              : recipe
          )
        );
      },
      onError: (error) => {
        console.error('Error approving recipe:', error);
        alert('Có lỗi xảy ra khi duyệt công thức. Vui lòng thử lại.');
      }
    });
  }, [approveMutation]);

  // Xử lý chỉnh sửa công thức
  const handleEditRecipe = useCallback((recipeId) => {
    navigate(`/recipes/edit/${recipeId}`);
  }, [navigate]);

  // Xử lý xóa công thức
  const handleDeleteRecipe = useCallback(async (recipeId) => {
    // Xác nhận trước khi xóa
    if (!window.confirm('Bạn có chắc muốn xóa công thức này và tất cả các bước của nó không?')) {
      return;
    }

    try {
      // Bước 1: Thử xóa các bước của công thức trước (không bắt buộc thành công)
      try {
        await deleteRecipeSteps.mutateAsync(recipeId);
      } catch (stepError) {
        console.warn('Failed to delete steps (this might be expected if cascade delete is set up):', stepError);
        // Tiếp tục xóa công thức ngay cả khi xóa bước thất bại
      }

      // Bước 2: Xóa công thức
      deleteRecipe.mutate(recipeId, {
        onSuccess: () => {
          // Cập nhật UI bằng cách loại bỏ công thức khỏi danh sách
          setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe._id !== recipeId));
        },
        onError: (error) => {
          console.error('Error deleting recipe:', error);
          alert('Có lỗi xảy ra khi xóa công thức. Vui lòng thử lại.');
        }
      });
    } catch (error) {
      console.error('Error in deletion process:', error);
      alert('Có lỗi xảy ra khi xóa công thức. Vui lòng thử lại.');
    }
  }, [deleteRecipe, deleteRecipeSteps]);

  // Xử lý trạng thái loading và lỗi
  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div className="text-red-600 text-center py-8">
        Có lỗi xảy ra khi tải dữ liệu: {error.message}
      </div>
    );
  }

  // Tính toán thông tin phân trang và kiểm tra có công thức nào không
  const totalPages = data?.pagination?.totalPages || 1;
  const hasRecipes = filteredAndSortedRecipes && filteredAndSortedRecipes.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pl-72">
      {/* Header - Tiêu đề trang và nút tạo công thức mới */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Công thức nấu ăn</h1>
        {isAuthenticated && (
          <Link
            to="/recipes/create"
            state={{ fromCreateRecipe: true }}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            <span>Tạo công thức</span>
          </Link>
        )}
      </div>

      {/* Thanh tìm kiếm */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm công thức... "
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Bộ lọc - Component riêng để lọc theo danh mục, sắp xếp, trạng thái */}
      <RecipeFilters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showApproved={showApproved}
        onApprovedChange={setShowApproved}
      />

      {/* Hiển thị kết quả */}
      {!hasRecipes ? (
        // Thông báo khi không tìm thấy công thức nào
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy công thức nào phù hợp.</p>
        </div>
      ) : (
        <>
          {/* Hiển thị số lượng kết quả */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredAndSortedRecipes.length} công thức
            </p>
          </div>

          {/* Danh sách các card công thức */}
          <div className="flex flex-col gap-6">
            {filteredAndSortedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                onApprove={handleApprove}
                onEdit={handleEditRecipe}
                onDelete={handleDeleteRecipe}
              />
            ))}
          </div>

          {/* Phân trang - Chỉ hiển thị khi có nhiều hơn 1 trang */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md transition-colors ${pageNum === page
                        ? 'bg-amber-600 text-white' // Trang hiện tại
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300' // Các trang khác
                      }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Component RecipeCard riêng để hiển thị thông tin từng công thức
const RecipeCard = React.memo(({ recipe, onEdit, onDelete }) => {
  // Tìm hình ảnh đầu tiên trong mảng imageUrls (bỏ qua video)
  const getFirstImage = (imageUrls) => {
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return 'https://via.placeholder.com/150';
    }
    
    // Tìm file đầu tiên không phải là video (.mp4, .webm, .avi, .mov)
    const firstImage = imageUrls.find(url => {
      if (!url) return false;
      const urlLower = url.toLowerCase();
      return !urlLower.includes('.mp4') && 
             !urlLower.includes('.webm') && 
             !urlLower.includes('.avi') && 
             !urlLower.includes('.mov');
    });
    
    return firstImage || 'https://via.placeholder.com/150';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 hover:shadow-lg transition-shadow">
      <div className="flex mb-4">
        {/* Hình ảnh công thức */}
        <img
          src={getFirstImage(recipe.imageUrls)}
          alt={recipe.name || 'Recipe image'}
          className="w-32 h-32 object-cover rounded-md mr-4 flex-shrink-0"
          loading="lazy" // Lazy loading để tối ưu hiệu suất
        />
        
        {/* Thông tin công thức */}
        <div className="flex-1 min-w-0">
          {/* Tên công thức */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
            {recipe.name || 'Untitled Recipe'}
          </h3>
          
          {/* Mô tả */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {recipe.description || 'No description available'}
          </p>

          {/* Thông tin meta (thời gian nấu, số người ăn) */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center text-gray-500 text-sm">
              <FiClock className="mr-1 flex-shrink-0" />
              <span>{recipe.cookingTime || 'N/A'}</span>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <FiUsers className="mr-1 flex-shrink-0" />
              <span>{recipe.servings || 'N/A'}</span>
            </div>
          </div>

          {/* Các nút hành động */}
          <div className="flex justify-between items-center">
            {/* Link xem chi tiết */}
            <Link
              to={`/recipes/${recipe._id}`}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
            >
              Xem chi tiết
            </Link>

            {/* Các nút chỉnh sửa và xóa */}
            <div className="flex gap-2">
              {/* Nút chỉnh sửa */}
              <button
                onClick={() => onEdit(recipe._id)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title="Cập nhật công thức"
              >
                <FiEdit className="h-5 w-5" />
              </button>

              {/* Nút xóa */}
              <button
                onClick={() => onDelete(recipe._id)}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                title="Xóa công thức"
              >
                <FiTrash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
});

// Đặt tên hiển thị cho component để dễ debug
RecipeCard.displayName = 'RecipeCard';

export default Recipes;