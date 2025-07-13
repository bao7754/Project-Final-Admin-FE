import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCheck, FiPlus, FiX } from 'react-icons/fi';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useAddStep } from '../../hooks/useRecipes';
import Loading from '../../components/Loading';

const AddStep = () => {
  const { id: recipeId } = useParams();
  const navigate = useNavigate();
  const [stepNumber, setStepNumber] = useState(1);
  const [tutorial, setTutorial] = useState('');
  const [duration, setDuration] = useState('');
  const [imageLinks, setImageLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const addStepMutation = useAddStep();

  const handleAddImageLink = () => {
    if (newLink && !imageLinks.includes(newLink)) {
      setImageLinks([...imageLinks, newLink]);
      setNewLink('');
    }
  };

  const handleRemoveImageLink = (idx) => {
    setImageLinks(imageLinks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e, isNext = false) => {
    e.preventDefault();
    if (!tutorial || !duration) {
      alert('Vui lòng nhập đầy đủ hướng dẫn và thời gian!');
      return;
    }
    if (imageLinks.length === 0) {
      alert('Vui lòng thêm ít nhất một ảnh minh họa!');
      return;
    }
    const stepData = {
      step: stepNumber,
      tutorial,
      recipeId,
      duration: parseInt(duration) * 60,
      imageUrls: imageLinks,
    };
    try {
      await addStepMutation.mutateAsync(stepData);
      if (isNext) {
        setStepNumber(stepNumber + 1);
        setTutorial('');
        setDuration('');
        setImageLinks([]);
      } else {
        navigate(`/dashboard`);
      }
    } catch (error) {
      alert('Lỗi khi thêm bước: ' + error.message);
    }
  };

  if (addStepMutation.isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 text-gray-800">
      <div className="container mx-auto px-4 py-8 pt-24 md:pl-72">
        <motion.button
          onClick={() => navigate(`/recipes/${recipeId}`)}
          className="flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Quay lại công thức"
        >
          <FiArrowLeft size={20} /> Quay lại
        </motion.button>

        <motion.div
          className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full mr-4">
              <FiPlus className="text-white" />
            </div>
            Thêm Bước {stepNumber}
          </h2>

          <form className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Hướng dẫn</label>
              <textarea
                value={tutorial}
                onChange={(e) => setTutorial(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                rows="5"
                placeholder="Nhập hướng dẫn chi tiết cho bước này..."
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                <FiClock className="mr-2 text-blue-600" /> Thời gian (phút)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                placeholder="Nhập thời gian (phút)"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Thêm ảnh bằng link</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dán link ảnh (https://...)"
                />
                <button
                  type="button"
                  onClick={handleAddImageLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Thêm
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {imageLinks.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={src}
                      alt={`link-img-${idx}`}
                      className="w-24 h-24 object-cover rounded-xl border shadow"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImageLink(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition"
                      aria-label="Xóa ảnh"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <motion.button
                type="submit"
                onClick={(e) => handleSubmit(e, true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={addStepMutation.isLoading}
              >
                Tiếp
              </motion.button>
              <motion.button
                type="submit"
                onClick={(e) => handleSubmit(e, false)}
                className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={addStepMutation.isLoading}
              >
                <FiCheck className="inline mr-2" /> Xong
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddStep;
