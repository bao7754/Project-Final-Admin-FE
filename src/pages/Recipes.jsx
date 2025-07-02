import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiPlus, FiCheckCircle, FiTag, FiUsers, FiClock, FiEdit } from 'react-icons/fi';
import { useRecipes } from '../hooks/useRecipes';
import RecipeFilters from '../components/RecipeFilters';
import Loading from '../components/Loading';
import useAuthStore from '../store/authStore';
import ImageUploaderModal from '../components/ImageUploader';
import { useApproveRecipe } from '../hooks/useRecipes';

const Recipes = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showApproved, setShowApproved] = useState('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipes, setRecipes] = useState([]);

  const { data, isLoading, error } = useRecipes(page);
  const { isAuthenticated } = useAuthStore();

  const approveMutation = useApproveRecipe();

  useMemo(() => {
    if (data?.data) {
      setRecipes(data.data);
    }
  }, [data?.data]);

  const filteredAndSortedRecipes = useMemo(() => {
    if (!recipes) return [];

    let filtered = recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory ||
        recipe.categoryIds.some(cat => cat.id === selectedCategory);

      const matchesApproval = showApproved === 'all' ||
        (showApproved === 'approved' && recipe.approvedAt) ||
        (showApproved === 'pending' && !recipe.approvedAt);

      return matchesSearch && matchesCategory && matchesApproval;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [recipes, searchTerm, selectedCategory, sortBy, showApproved]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleApprove = (recipeId) => {
    approveMutation.mutate(recipeId);
    setRecipes(prevRecipes =>
      prevRecipes.map(recipe =>
        recipe._id === recipeId ? { ...recipe, approvedAt: new Date().toISOString() } : recipe
      )
    );
  };

  const handleEditRecipe = (recipeId) => {
    setSelectedRecipeId(recipeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-red-600">Có lỗi xảy ra khi tải dữ liệu!</div>;

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pl-72">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Công thức nấu ăn</h1>
        {isAuthenticated && (
          <Link
            to="/recipes/create"
            className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <FiPlus className="h-4 w-4" />
            <span>Tạo công thức</span>
          </Link>
        )}
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm công thức..."
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <RecipeFilters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showApproved={showApproved}
        onApprovedChange={setShowApproved}
      />

      {filteredAndSortedRecipes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy công thức nào phù hợp.</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredAndSortedRecipes.length} công thức
            </p>
          </div>

          {/* Display Recipes in Row Layout */}
          <div className="flex flex-col gap-6">
            {filteredAndSortedRecipes.map((recipe) => (
              <div key={recipe._id} className="bg-white rounded-lg shadow-md overflow-hidden p-4">
                <div className="flex mb-4">
                  <img
                    src={recipe.imageUrls[0] || 'https://via.placeholder.com/150'}
                    alt={recipe.name}
                    className="w-32 h-32 object-cover rounded-md mr-4"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{recipe.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        <FiClock className="mr-1" />
                        <span>{recipe.cookingTime}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <FiUsers className="mr-1" />
                        <span>{recipe.servings}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <FiTag className="mr-1" />
                        <span>{recipe.price.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Link
                        to={`/recipes/${recipe._id}`}
                        className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                      >
                        Xem chi tiết
                      </Link>
                      {/* Approval Button */}
                      <button
                        onClick={() => handleApprove(recipe._id)}
                        className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none"
                        title="Duyệt công thức"
                      >
                        <FiCheckCircle className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleEditRecipe(recipe._id)}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none"
                        title="Cập nhật công thức"
                      >
                        <FiEdit className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {recipe.approvedAt ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Đã duyệt
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      Chưa duyệt
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`mx-1 px-3 py-1 rounded-md ${pageNum === page
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {isModalOpen && selectedRecipeId && (
        <ImageUploaderModal
          recipeId={selectedRecipeId}
          currentImages={filteredAndSortedRecipes.find(r => r._id === selectedRecipeId)?.imageUrls || []}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Recipes;
