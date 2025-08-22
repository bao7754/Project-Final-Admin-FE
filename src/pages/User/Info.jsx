import React, { useState, useEffect, useRef } from 'react';
import { useUserDetail, useUpdateUser } from './../../hooks/useAuth';
import { useUploadImage } from './../../hooks/useUploadImage';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { User, Mail, Edit2, Save, X, Calendar, Clock, RefreshCw, Settings, Camera, Upload } from 'lucide-react';

const UserDetailLayout = ({ userId: propUserId }) => {
  const userId = propUserId || localStorage.getItem('userId');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    avatar: ''
  });
  
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useUserDetail(userId);
  const updateMutation = useUpdateUser();
  const uploadImageMutation = useUploadImage();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Validate avatar file
  const validateAvatarFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!file) {
      return { isValid: false, error: 'Không có file được chọn' };
    }

    const fileType = file.type.toLowerCase();
    if (!allowedTypes.includes(fileType)) {
      return { 
        isValid: false, 
        error: 'Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP' 
      };
    }
    
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: 'File ảnh quá lớn. Kích thước tối đa là 5MB' 
      };
    }

    if (!file.name || file.name.length > 255) {
      return { isValid: false, error: 'Tên file không hợp lệ' };
    }
    
    return { isValid: true };
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file) => {
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await new Promise((resolve, reject) => {
        uploadImageMutation.mutate(formData, {
          onSuccess: (response) => {
            let avatarUrl;
            
            if (Array.isArray(response)) {
              if (response.length > 0 && response[0]?.url) {
                avatarUrl = response[0].url;
              } else if (response.length > 0) {
                avatarUrl = response[0];
              }
            }
            else if (response?.data?.url) {
              avatarUrl = response.data.url;
            } else if (response?.url) {
              avatarUrl = response.url;
            } else if (response?.data?.filePath) {
              avatarUrl = response.data.filePath;
            } else if (response?.filePath) {
              avatarUrl = response.filePath;
            } else if (typeof response === 'string') {
              avatarUrl = response;
            } else {
              avatarUrl = response?.data || response;
            }
            
            resolve(avatarUrl);
          },
          onError: (error) => {
            reject(error);
          }
        });
      });
      
      if (response) {
        // Update avatar in form data
        setFormData(prev => ({ ...prev, avatar: response }));
        
        // Auto-save avatar
        try {
          await updateMutation.mutateAsync({
            id: userId,
            userData: { ...formData, avatar: response }
          });
          
          queryClient.invalidateQueries({ queryKey: ['userDetail', userId] });
          toast.success('Cập nhật avatar thành công!');
        } catch (updateError) {
          console.error('Update avatar failed:', updateError);
          toast.error('Lỗi khi cập nhật avatar');
        }
      } else {
        throw new Error('Không nhận được URL ảnh từ server');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      const errorMsg = error?.response?.data?.message || 
                      error?.response?.data?.error ||
                      error.message || 
                      'Lỗi upload avatar không xác định';
      toast.error(`Lỗi upload avatar: ${errorMsg}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email không được để trống');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id: userId,
        userData: formData
      });
      
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['userDetail', userId] });
      toast.success('Cập nhật thông tin thành công!');
      
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 font-medium">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Lỗi tải thông tin</h3>
                <p className="text-red-600 text-sm">{error.message}</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <User className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-yellow-800 font-medium">Không tìm thấy thông tin người dùng</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isFormChanged = () => {
    return formData.fullName !== (user.fullName || '') || 
           formData.email !== user.email ||
           formData.avatar !== (user.avatar || '');
  };

  return (
    <div className="pt-20 pb-8 min-h-screen bg-gray-50">
      <div className="ml-64 mr-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {/* Avatar Section */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-lg">
                  <img
                    src={formData.avatar || user.avatar || 'https://icons.veryicon.com/png/o/miscellaneous/rookie-official-icon-gallery/225-default-avatar.png'}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://icons.veryicon.com/png/o/miscellaneous/rookie-official-icon-gallery/225-default-avatar.png';
                    }}
                  />
                </div>
                
                {/* Avatar Upload Button */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-2 -right-2 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-blue-600 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed border-2 border-blue-100"
                  title="Thay đổi avatar"
                >
                  {isUploadingAvatar ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleAvatarUpload(e.target.files[0])}
                  className="hidden"
                  ref={avatarInputRef}
                  disabled={isUploadingAvatar}
                />
              </div>
              
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl font-bold">
                  {user.fullName || 'Chưa cập nhật tên'}
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">{user.email}</p>
              </div>
            </div>
            
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Edit2 className="h-4 sm:h-5 w-4 sm:w-5" />
                <span className="font-medium">Chỉnh sửa</span>
              </button>
            ) : (
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="bg-white/15 hover:bg-white/25 disabled:bg-white/10 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Hủy</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending || !isFormChanged()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {updateMutation.isPending ? 'Đang lưu...' : 'Cập nhật'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Thông tin cá nhân</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>Họ và tên</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                    placeholder="Nhập họ và tên"
                    autoFocus
                    disabled={updateMutation.isPending}
                  />
                ) : (
                  <div className="bg-gray-50 border-2 border-gray-100 px-4 py-3 rounded-xl min-h-[50px] flex items-center">
                    <span className="text-gray-900 font-medium">
                      {user.fullName || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Email</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                    placeholder="Nhập email"
                    disabled={updateMutation.isPending}
                  />
                ) : (
                  <div className="bg-gray-50 border-2 border-gray-100 px-4 py-3 rounded-xl min-h-[50px] flex items-center">
                    <span className="text-gray-900 font-medium">{user.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Thông tin hệ thống</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <div className="bg-purple-100 p-1.5 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>Ngày tạo tài khoản</span>
                </label>
                <div className="bg-gray-50 border-2 border-gray-100 px-4 py-3 rounded-xl">
                  <p className="text-gray-700 font-medium text-sm">
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Không có thông tin'
                    }
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <div className="bg-orange-100 p-1.5 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <span>Cập nhật lần cuối</span>
                </label>
                <div className="bg-gray-50 border-2 border-gray-100 px-4 py-3 rounded-xl">
                  <p className="text-gray-700 font-medium text-sm">
                    {user.updatedAt 
                      ? new Date(user.updatedAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Không có thông tin'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {(updateMutation.isPending || isUploadingAvatar) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 shadow-2xl border border-gray-200 max-w-sm w-full mx-4">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {isUploadingAvatar ? 'Đang tải avatar' : 'Đang cập nhật'}
                </h3>
                <p className="text-gray-600 text-sm mt-1">Vui lòng đợi trong giây lát...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailLayout;