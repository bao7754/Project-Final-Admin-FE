import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useRecipe } from '../hooks/useRecipes';
import Loading from '../components/Loading';
import ImageUploader from '../components/ImageUploader';

const RecipeEdit = () => {
  const { id } = useParams(); const { data: recipe, isLoading, error } = useRecipe(id);
  const navigate = useNavigate();

  if (isLoading) return <Loading />;
  if (error || !recipe) return <div className="text-red-600 p-4">Không thể tải thông tin công thức!</div>;

  return (
    <div className="container mx-auto px-4 py-8pt-20 md:pl-72">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-amber-600 hover:text-amber-700"
        >
          <FiArrowLeft className="mr-2" /> Quay lại</button>
      </div>
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa: {recipe.name}</h1></div>

      <ImageUploader recipeId={recipe._id} currentImages={recipe.imageUrls} />\
    </div>);
};

export default RecipeEdit;
