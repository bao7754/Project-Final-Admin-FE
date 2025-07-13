import React, { useState, useMemo } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
import useAuthStore from '../../store/authStore';

const Category = () => {
  const [page] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputName, setInputName] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'

  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useCategories(page);
  const categories = Array.isArray(data) ? data : data?.data || [];

  const filtered = useMemo(() => {
    return categories.filter(cat =>
      cat?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // Create
  const createCategory = useCreateCategory();
  const handleAdd = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    createCategory.mutate({ name: inputName }, {
      onSuccess: () => {
        setInputName('');
        setShowModal(false);
      },
    });
  };

  // Edit
  const updateCategory = useUpdateCategory();
  const handleEdit = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    updateCategory.mutate(
      { id: selectedId, name: inputName },
      {
        onSuccess: () => {
          setShowModal(false);
          setInputName('');
          setSelectedId(null);
        },
      }
    );
  };

  // Delete
  const deleteCategory = useDeleteCategory();
  const handleDelete = (id) => {
    deleteCategory.mutate(id, {
      onSuccess: () => {
        setShowModal(false);
        setInputName('');
        setSelectedId(null);
      }
    });
  };


  // Open modal cho thêm
  const openAddModal = () => {
    setModalMode('add');
    setInputName('');
    setSelectedId(null);
    setShowModal(true);
  };

  // Open modal cho sửa/xóa
  const openEditModal = (cat) => {
    setModalMode('edit');
    setSelectedId(cat.id);
    setInputName(cat.name || '');
    setShowModal(true);
  };

  if (isLoading) return <div>Đang tải...</div>;
  if (error) return <div className="text-red-600">Có lỗi khi tải danh mục!</div>;

  // Hàm format ngày
  const formatDate = (dateString) => {
    if (!dateString) return "Không rõ";
    const date = new Date(dateString);
    if (isNaN(date)) return "Không rõ";
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20 md:pl-72">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Danh mục</h1>
        {isAuthenticated && (
          <button
            onClick={openAddModal}
            className="flex items-center px-6 py-3 text-lg bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <FiPlus className="mr-3 text-xl" />
            Thêm danh mục
          </button>
        )}
      </div>

      <div className="relative mb-6 max-w-lg">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm danh mục..."
          className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy danh mục nào.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr className="border-b">
                <th className="p-4 text-lg">STT</th>
                <th className="p-4 text-lg">Tên danh mục</th>
                <th className="p-4 text-lg">Ngày tạo</th>
                <th className="p-4 text-lg text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, idx) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{idx + 1}</td>
                  <td className="p-4">{cat.name}</td>
                  <td className="p-4">{formatDate(cat.createdAt || cat.updatedAt)}</td>
                  <td className="p-4 text-right flex gap-4 justify-end">
                    <button
                      className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                      onClick={() => openEditModal(cat)}
                      title="Sửa"
                    >
                      <FiEdit className="text-xl" />
                    </button>
                    <button
                      className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
                      onClick={() => {
                        if (window.confirm('Bạn chắc chắn muốn xóa?')) {
                          handleDelete(cat.id);
                        }
                      }}
                      title="Xóa"
                    >
                      <FiTrash2 className="text-xl" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl w-[32rem] max-w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">
              {modalMode === 'add' ? 'Thêm danh mục' : 'Cập nhật danh mục'}
            </h2>
            <form onSubmit={modalMode === 'add' ? handleAdd : handleEdit}>
              <input
                type="text"
                className="border px-4 py-3 rounded-lg w-full mb-6 text-lg focus:ring-amber-500 focus:outline-none"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                placeholder="Tên danh mục"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-lg"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-3 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-lg"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Category;
