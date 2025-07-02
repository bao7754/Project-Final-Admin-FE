import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiDollarSign, FiTag, FiEdit, FiArrowLeft } from 'react-icons/fi';
import { useRecipe, useApproveRecipe } from '../hooks/useRecipes';
import useAuthStore from '../store/authStore';
import Loading from '../components/Loading';

const RecipeDetail = () => {
  const { id } = useParams();
  const { data: recipe, isLoading, error } = useRecipe(id);
  const { user } = useAuthStore();
  const approveMutation = useApproveRecipe();
  const navigate = useNavigate();

  if (isLoading) return <Loading />;
  if (error || !recipe) return <div className="text-red-600">Không thể tải thông tin công thức!</div>;

  const handleApprove = () => {
    if (id) {
      approveMutation.mutate(id);
    }
  };

  const isAdmin = user?.role === 'admin';
  const needsApproval = !recipe.approvedAt;

  const placeholderImages = [
    'https://picsum.photos/1920/1080',
    'https://picsum.photos/1920/1081',
    'https://picsum.photos/1920/1082'
  ];

  const getPlaceholderImage = (id) => {
    const index = id.charCodeAt(0) % placeholderImages.length;
    return placeholderImages[index];
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-amber-600 hover:text-amber-700"
        >
          <FiArrowLeft className="mr-2" /> Quay lại
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{recipe.name}</h1>
        <div className="flex space-x-3">
          {isAdmin && needsApproval && (
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {approveMutation.isPending ? 'Đang duyệt...' : 'Duyệt công thức'}
            </button>
          )}
          {isAdmin && (
            <Link to={`/recipes/edit/${recipe._id}`}>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                <FiEdit className="mr-2" />
                Chỉnh sửa
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="rounded-lg overflow-hidden shadow-md mb-4">
            <img
              src={recipe.imageUrls[0] || getPlaceholderImage(recipe._id)}
              alt={recipe.name}
              className="w-full h-80 object-cover"
            />
          </div>
          {recipe.imageUrls.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {recipe.imageUrls.slice(1).map((url, index) => (
                <div key={index} className="rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={url || placeholderImages[(index + 1) % placeholderImages.length]}
                    alt={`${recipe.name} ${index + 2}`}
                    className="w-full h-24 object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-gray-700 mb-6">{recipe.description}</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <FiClock className="text-amber-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Thời gian nấu</p>
                  <p className="font-medium">{recipe.cookingTime}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FiUsers className="text-amber-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Khẩu phần</p>
                  <p className="font-medium">{recipe.servings}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FiDollarSign className="text-amber-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Chi phí ước tính</p>
                  <p className="font-medium">{recipe.price.toLocaleString('vi-VN')} VNĐ</p>
                </div>
              </div>
              <div className="flex items-center">
                <FiTag className="text-amber-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Danh mục</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recipe.categoryIds.map((category) => (
                      <span
                        key={category._id}
                        className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Nguyên liệu</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-600 mt-2 mr-2"></span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Hướng dẫn nấu ăn</h3>
        <div className="prose max-w-none">
          <p className="whitespace-pre-line">{recipe.instructions}</p>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
