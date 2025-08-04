import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiPlus, FiCheckCircle, FiTag, FiUsers, FiClock, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useDeleteRecipe, useRecipes, useDeleteStep } from '../../hooks/useRecipes';
import RecipeFilters from '../../components/RecipeFilters';
import Loading from '../../components/Loading';
import useAuthStore from '../../store/authStore';
import { useApproveRecipe } from '../../hooks/useRecipes';

// Hàm chuyển đổi chuỗi có dấu thành không dấu
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
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showApproved, setShowApproved] = useState('all');
  const [recipes, setRecipes] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, error } = useRecipes(page);
  const { isAuthenticated } = useAuthStore();
  const approveMutation = useApproveRecipe();
  const deleteRecipe = useDeleteRecipe();
  const deleteRecipeSteps = useDeleteStep();

  // Handle returning from create recipe page
  useEffect(() => {
    if (location.state?.fromCreateRecipe) {
      setPage(1);
      setShowApproved('all');
      // Clear the state to prevent repeated resets
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Update recipes when data changes
  useEffect(() => {
    if (data?.data) {
      setRecipes(data.data);
    } else {
      setRecipes([]);
    }
  }, [data?.data]);

  // Memoized filtered and sorted recipes với search function được cải thiện
  const filteredAndSortedRecipes = useMemo(() => {
    if (!recipes || recipes.length === 0) {
      return [];
    }

    let filtered = recipes.filter(recipe => {
      // Search filter - Cải thiện để tìm kiếm cả có dấu và không dấu
      let matchesSearch = true;
      if (searchTerm) {
        const searchTermNormalized = removeVietnameseAccents(searchTerm.toLowerCase());
        const recipeName = removeVietnameseAccents(recipe.name?.toLowerCase() || '');
        const recipeDescription = removeVietnameseAccents(recipe.description?.toLowerCase() || '');
        
        matchesSearch = recipeName.includes(searchTermNormalized) || 
                      recipeDescription.includes(searchTermNormalized);
      }

      // Category filter - Sửa lại logic này
      let matchesCategory = true;
      if (selectedCategory) {
        if (recipe.categoryIds && Array.isArray(recipe.categoryIds)) {
          // Trường hợp categoryIds là array of objects
          if (recipe.categoryIds.length > 0 && typeof recipe.categoryIds[0] === 'object') {
            matchesCategory = recipe.categoryIds.some(cat =>
              cat.id === selectedCategory || cat._id === selectedCategory || cat.name === selectedCategory
            );
          }
          // Trường hợp categoryIds là array of strings
          else {
            matchesCategory = recipe.categoryIds.includes(selectedCategory);
          }
        } else {
          matchesCategory = false;
        }
      }

      // Approval filter
      const matchesApproval = showApproved === 'all' ||
        (showApproved === 'approved' && recipe.approvedAt) ||
        (showApproved === 'pending' && !recipe.approvedAt);

      return matchesSearch && matchesCategory && matchesApproval;
    });

    // Sort recipes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [recipes, searchTerm, selectedCategory, sortBy, showApproved]);

  // Handlers
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleApprove = useCallback((recipeId) => {
    approveMutation.mutate(recipeId, {
      onSuccess: () => {
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

  const handleEditRecipe = useCallback((recipeId) => {
    navigate(`/recipes/edit/${recipeId}`);
  }, [navigate]);

  const handleDeleteRecipe = useCallback(async (recipeId) => {
    if (!window.confirm('Bạn có chắc muốn xóa công thức này và tất cả các bước của nó không?')) {
      return;
    }

    try {
      // Try to delete steps first, but don't fail if it doesn't work
      try {
        await deleteRecipeSteps.mutateAsync(recipeId);
      } catch (stepError) {
        console.warn('Failed to delete steps (this might be expected if cascade delete is set up):', stepError);
        // Continue with recipe deletion even if step deletion fails
      }

      // Delete the recipe
      deleteRecipe.mutate(recipeId, {
        onSuccess: () => {
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

  // Loading and error states
  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div className="text-red-600 text-center py-8">
        Có lỗi xảy ra khi tải dữ liệu: {error.message}
      </div>
    );
  }

  const totalPages = data?.pagination?.totalPages || 1;
  const hasRecipes = filteredAndSortedRecipes && filteredAndSortedRecipes.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pl-72">
      {/* Header */}
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

      {/* Search */}
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

      {/* Filters */}
      <RecipeFilters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showApproved={showApproved}
        onApprovedChange={setShowApproved}
      />

      {/* Results */}
      {!hasRecipes ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy công thức nào phù hợp.</p>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredAndSortedRecipes.length} công thức
            </p>
          </div>

          {/* Recipe cards */}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md transition-colors ${pageNum === page
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
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

// Separate RecipeCard component for better organization
const RecipeCard = React.memo(({ recipe, onApprove, onEdit, onDelete }) => {
  const isApproved = Boolean(recipe.approvedAt);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 hover:shadow-lg transition-shadow">
      <div className="flex mb-4">
        <img
          src={recipe.imageUrls?.[0] || 'https://via.placeholder.com/150'}
          alt={recipe.name || 'Recipe image'}
          className="w-32 h-32 object-cover rounded-md mr-4 flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
            {recipe.name || 'Untitled Recipe'}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {recipe.description || 'No description available'}
          </p>

          {/* Recipe meta info */}
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

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Link
              to={`/recipes/${recipe._id}`}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
            >
              Xem chi tiết
            </Link>

            <div className="flex gap-2">
              <button
                onClick={() => onApprove(recipe._id)}
                className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                title="Duyệt công thức"
                disabled={isApproved}
              >
                <FiCheckCircle className="h-5 w-5" />
              </button>

              <button
                onClick={() => onEdit(recipe._id)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title="Cập nhật công thức"
              >
                <FiEdit className="h-5 w-5" />
              </button>

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

      {/* Status badge */}
      <div className="flex items-center space-x-2">
        <span className={`text-xs px-2 py-1 rounded-full ${isApproved
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
          }`}>
          {isApproved ? 'Đã duyệt' : 'Chưa duyệt'}
        </span>
      </div>
    </div>
  );
});

RecipeCard.displayName = 'RecipeCard';

export default Recipes;