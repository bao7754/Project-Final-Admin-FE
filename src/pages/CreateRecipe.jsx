import React from 'react';
import { useNavigate } from 'react-router-dom';
import RecipeForm from '../components/RecipeForm';

const CreateRecipe = () => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/recipes');
  };

  const handleSuccess = () => {
    navigate('/recipes');
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pl-72">
      <RecipeForm onCancel={handleCancel} onSuccess={handleSuccess} />
    </div>
  );
};

export default CreateRecipe;
