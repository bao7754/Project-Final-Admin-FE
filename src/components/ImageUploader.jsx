import React, { useState } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import { useUpdateRecipe } from '../hooks/useRecipes';

const ImageUploaderModal = ({ recipeId, currentImages, onClose }) => {
  const [images, setImages] = useState(currentImages);
  const updateMutation = useUpdateRecipe();

  const handleImageChange = (e) => {
    if (e.target.files) {
      const newImages = [...images];
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result);
            setImages([...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSaveImages = () => {
    updateMutation.mutate({
      id: recipeId,
      data: { imageUrls: images }
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full sm:w-11/12 md:w-8/12 lg:w-1/2 xl:w-1/3 relative overflow-y-auto max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full"
        >
          <FiX className="h-4 w-4" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quản lý hình ảnh</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {/* Display uploaded images */}
          {images.map((image, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden shadow-md hover:scale-105 transition-all">
              <img
                src={image || 'https://via.placeholder.com/150x150'}
                alt={`Ảnh ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg transition-transform duration-300"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* File Upload Area */}
          <div className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <label className="flex flex-col items-center space-y-2 cursor-pointer">
              <FiUpload className="h-12 w-12 text-gray-500 mb-2" />
              <p className="text-sm text-gray-500">Kéo và thả ảnh vào đây</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveImages}
            disabled={updateMutation.isLoading}
            className={`px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50`}
          >
            {updateMutation.isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploaderModal;
