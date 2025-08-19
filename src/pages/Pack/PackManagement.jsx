import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Package, Clock, DollarSign, Calendar, X, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import { getPacks } from '../../hooks/usePack';
import { packApi } from '../../api/index';
import { toast } from 'react-hot-toast';

const PackManagement = () => {
  const { data: packs, isLoading, error, refetch } = getPacks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: ''
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const openModal = (pack = null) => {
    if (pack) {
      setEditingPack(pack);
      setFormData({
        name: pack.name,
        price: pack.price.toString(),
        duration: pack.duration.toString()
      });
    } else {
      setEditingPack(null);
      setFormData({
        name: '',
        price: '',
        duration: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPack(null);
    setFormData({
      name: '',
      price: '',
      duration: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price || !formData.duration) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const packData = {
        name: formData.name.trim(),
        price: parseInt(formData.price),
        duration: parseInt(formData.duration)
      };

      if (editingPack) {
        await packApi.updatePack(editingPack.id, packData);
        toast.success('Cập nhật gói thành công!');
      } else {
        await packApi.createPack(packData);
        toast.success('Thêm gói mới thành công!');
      }

      refetch();
      closeModal();
    } catch (error) {
      console.error('Error submitting pack:', error);
      toast.error(editingPack ? 'Lỗi cập nhật gói' : 'Lỗi thêm gói mới');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setIsSubmitting(true);
    
    try {
      await packApi.deletePack(id);
      toast.success('Xóa gói thành công!');
      refetch();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting pack:', error);
      toast.error('Lỗi xóa gói');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6 ml-64">
      <div className="max-w-7xl mx-auto pt-15">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 ">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Quản lý gói dịch vụ premium</h1>
                </div>
              </div>
              <button
                onClick={() => openModal()}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 backdrop-blur-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">Thêm gói mới</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải danh sách gói...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
                <p className="text-gray-500 mb-4">{error.message}</p>
                <button
                  onClick={() => refetch()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Thử lại</span>
                </button>
              </div>
            ) : !packs || packs.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có gói nào</h3>
                <p className="text-gray-500 mb-4">Bắt đầu bằng cách tạo gói premium đầu tiên</p>
                <button
                  onClick={() => openModal()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm gói mới</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packs.map((pack) => (
                  <div key={pack.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative">
                    <div className="absolute top-4 right-4 flex space-x-1">
                      <button
                        onClick={() => openModal(pack)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 z-10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(pack.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 z-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mb-4 pr-20">
                      <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{pack.name}</h3>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatPrice(pack.price)} ₫
                      </div>
                      <div className="flex items-center text-gray-600 mb-4">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{pack.duration} tháng</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Tạo: {formatDate(pack.createdAt)}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Cập nhật: {formatDate(pack.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {editingPack ? 'Chỉnh sửa gói' : 'Thêm gói mới'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên gói
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder="Ví dụ: 1 tháng, 3 tháng..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giá (VND)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder="20000"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thời hạn (tháng)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder="1"
                  min="1"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 px-4 py-3 rounded-xl font-medium transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{editingPack ? 'Cập nhật' : 'Thêm mới'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa gói này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <span>Xóa</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackManagement;