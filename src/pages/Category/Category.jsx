import React, { useState, useMemo, useRef } from 'react';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiImage, FiUpload, FiX } from 'react-icons/fi';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
import { useUploadImage } from '../../hooks/useUploadImage';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';

const Category = () => {
  const [page] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputName, setInputName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState(''); // Thêm state để lưu ảnh hiện tại
  const [isUploading, setIsUploading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const fileInputRef = useRef(null);

  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useCategories(page);
  const uploadImage = useUploadImage();
  console.log('Categories data:', data);
  const categories = Array.isArray(data) ? data : data?.data || [];

  const filtered = useMemo(() => {
    return categories.filter(cat =>
      cat?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh!');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear all image states
  const clearAllImageStates = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image and get URL
  const uploadImageFile = async () => {
    if (!selectedFile) return null;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', selectedFile);
      
      const response = await new Promise((resolve, reject) => {
        uploadImage.mutate(formData, {
          onSuccess: (response) => resolve(response),
          onError: (error) => reject(error)
        });
      });
      
      setIsUploading(false);
      
      let imageUrl;

      // Handle multiple response formats like in RecipeForm
      if (Array.isArray(response)) {
        if (response.length > 0 && response[0]?.url) {
          imageUrl = response[0].url;
        } else if (response.length > 0) {
          imageUrl = response[0];
        }
      }
      else if (response?.data?.url) {
        imageUrl = response.data.url;
      } else if (response?.url) {
        imageUrl = response.url;
      } else if (response?.data?.filePath) {
        imageUrl = response.data.filePath;
      } else if (response?.filePath) {
        imageUrl = response.filePath;
      } else if (typeof response === 'string') {
        imageUrl = response;
      } else {
        imageUrl = response?.data || response;
      }

      if (!imageUrl) {
        throw new Error('Không nhận được URL ảnh từ server');
      }
      
      return imageUrl;
    } catch (error) {
      setIsUploading(false);
      console.error('Upload error:', error);
      
      // Handle 401 error specifically
      if (error?.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      
      throw error;
    }
  };

  // Create
  const createCategory = useCreateCategory();
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!inputName.trim()) {
      toast.error('Vui lòng nhập tên danh mục!');
      return;
    }

    try {
      let imageUrl = null;
      
      // If user selected a file, upload it first
      if (selectedFile) {
        imageUrl = await uploadImageFile();
      }

      createCategory.mutate({ 
        name: inputName,
        imageUrl: imageUrl
      }, {
        onSuccess: () => {
          setInputName('');
          clearAllImageStates();
          setShowModal(false);
          toast.success('Thêm danh mục thành công!');
        },
      });
    } catch (error) {
      console.error('Có lỗi khi tạo danh mục:', error);
    }
  };

  // Edit
  const updateCategory = useUpdateCategory();
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!inputName.trim()) {
      toast.error('Vui lòng nhập tên danh mục!');
      return;
    }

    try {
      let imageUrl = currentImageUrl; // Giữ ảnh cũ nếu không có ảnh mới
      
      // If user selected a new file, upload it first
      if (selectedFile) {
        imageUrl = await uploadImageFile();
      }

      updateCategory.mutate(
        { 
          id: selectedId, 
          name: inputName,
          imageUrl: imageUrl
        },
        {
          onSuccess: () => {
            setShowModal(false);
            setInputName('');
            clearAllImageStates();
            setSelectedId(null);
        
          },
        }
      );
    } catch (error) {
      console.error('Có lỗi khi cập nhật danh mục:', error);
    }
  };

  // Delete
  const deleteCategory = useDeleteCategory();
  const handleDelete = (id) => {
    deleteCategory.mutate(id, {
      onSuccess: () => {
        setShowModal(false);
        setInputName('');
        clearAllImageStates();
        setSelectedId(null);
        toast.success('Xóa danh mục thành công!');
      }
    });
  };

  // Open modal cho thêm
  const openAddModal = () => {
    setModalMode('add');
    setInputName('');
    clearAllImageStates();
    setSelectedId(null);
    setShowModal(true);
  };

  // Open modal cho sửa/xóa
  const openEditModal = (cat) => {
    setModalMode('edit');
    setSelectedId(cat.id);
    setInputName(cat.name || '');
    clearAllImageStates(); // Clear trước
    setCurrentImageUrl(cat.imageUrl || ''); // Set ảnh hiện tại
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
                <th className="p-4 text-lg">Ảnh</th>
                <th className="p-4 text-lg">Tên danh mục</th>
                <th className="p-4 text-lg">Ngày tạo</th>
                <th className="p-4 text-lg text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, idx) => (
                <tr key={cat.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{idx + 1}</td>
                  <td className="p-4">
                    {cat.imageUrl ? (
                      <img 
                        src={cat.imageUrl} 
                        alt={cat.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-16 h-16 ${cat.imageUrl ? 'hidden' : 'flex'} items-center justify-center bg-gray-100 rounded-lg border border-gray-200`}
                    >
                      <FiImage className="text-gray-400 text-2xl" />
                    </div>
                  </td>
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
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-opacity-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">
              {modalMode === 'add' ? 'Thêm danh mục' : 'Cập nhật danh mục'}
            </h2>
            <form onSubmit={modalMode === 'add' ? handleAdd : handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  className="border px-4 py-2 rounded-lg w-full focus:ring-amber-500 focus:outline-none"
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  placeholder="Nhập tên danh mục"
                  autoFocus
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh danh mục
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={isUploading}
                    >
                      <FiUpload className="mr-2" />
                      {selectedFile ? 'Chọn ảnh khác' : 'Chọn ảnh từ máy'}
                    </button>
                    
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FiX className="mr-1" />
                        Xóa
                      </button>
                    )}
                  </div>
                  
          
                  {/* Hiển thị ảnh mới được chọn */}
                  {previewUrl && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Ảnh mới:</p>
                      <img 
                        src={previewUrl} 
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  
                  {/* Hiển thị ảnh hiện tại khi edit và chưa chọn ảnh mới */}
                  {!previewUrl && currentImageUrl && modalMode === 'edit' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Ảnh hiện tại:</p>
                      <img 
                        src={currentImageUrl} 
                        alt="Current"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={isUploading || createCategory.isPending || updateCategory.isPending}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang upload...
                    </>
                  ) : (
                    modalMode === 'add' ? 'Thêm' : 'Cập nhật'
                  )}
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