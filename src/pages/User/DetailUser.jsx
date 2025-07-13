import React from 'react';
import { FiArrowLeft, FiMail, FiPhone, FiHome, FiUser, FiCalendar, FiStar, FiShield } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserDetail } from '../../hooks/useAuth';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useUserDetail(id);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return `${date.toLocaleTimeString('vi-VN', { hour12: false })} ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-indigo-600 border-r-purple-600 shadow-lg"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 blur-xl animate-pulse"></div>
          <p className="mt-4 text-gray-600 text-center font-medium">Đang tải...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUser className="text-red-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Có lỗi xảy ra</h3>
          <p className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
            {error?.message || 'Không tìm thấy thông tin người dùng!'}
          </p>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24 md:pl-72 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
      {/* Back Button */}
      <motion.button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 mb-8 px-6 py-3 rounded-2xl bg-white text-gray-700 hover:text-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 border border-gray-200 hover:border-indigo-300"
        whileHover={{ scale: 1.02, x: -3 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="font-medium">Quay lại</span>
      </motion.button>

      {/* Main Card */}
      <motion.div
        className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 overflow-hidden relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          {/* User Avatar & Info */}
          <motion.div
            className="flex flex-col items-center mb-10"
            variants={itemVariants}
          >
            <div className="relative">
              {user.avatar ? (
                <motion.img
                  src={user.avatar}
                  alt={user.fullName || 'Avatar người dùng'}
                  className="w-40 h-40 rounded-full border-4 border-white object-cover shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/160')}
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-6xl text-indigo-500 shadow-2xl border-4 border-white">
                  <FiUser />
                </div>
              )}
              {user.premium && (
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <FiStar className="text-white" size={20} />
                </div>
              )}
            </div>
            
            <motion.h1
              className="text-4xl font-bold text-gray-900 mb-3 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {user.fullName || '—'}
            </motion.h1>
            
            <div className="flex items-center gap-3 text-gray-600 text-sm font-medium bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-2 rounded-full shadow-sm border border-indigo-100">
              <FiShield className="text-indigo-500" size={16} />
              <span>ID: {user._id}</span>
            </div>
          </motion.div>

          {/* User Details Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={containerVariants}
          >
            {/* Email */}
            <motion.div
              className="group flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 shadow-sm hover:shadow-md border border-blue-100"
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FiMail className="text-white" size={20} />
              </div>
              <div>
                <span className="font-semibold text-gray-800 block">Email</span>
                <p className="font-medium text-gray-900 truncate">{user.email || '—'}</p>
              </div>
            </motion.div>

            {/* Phone */}
            <motion.div
              className="group flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 shadow-sm hover:shadow-md border border-green-100"
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FiPhone className="text-white" size={20} />
              </div>
              <div>
                <span className="font-semibold text-gray-800 block">Số điện thoại</span>
                <p className="font-medium text-gray-900">{user.phone || '—'}</p>
              </div>
            </motion.div>

            {/* Address */}
            <motion.div
              className="group flex items-center gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-all duration-300 shadow-sm hover:shadow-md border border-purple-100"
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FiHome className="text-white" size={20} />
              </div>
              <div>
                <span className="font-semibold text-gray-800 block">Địa chỉ</span>
                <p className="font-medium text-gray-900">{user.address || '—'}</p>
              </div>
            </motion.div>

            {/* Created Date */}
            <motion.div
              className="group flex items-center gap-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl hover:from-orange-100 hover:to-red-100 transition-all duration-300 shadow-sm hover:shadow-md border border-orange-100"
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FiCalendar className="text-white" size={20} />
              </div>
              <div>
                <span className="font-semibold text-gray-800 block">Ngày tạo</span>
                <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </motion.div>

            {/* Updated Date */}
            <motion.div
              className="group flex items-center gap-4 p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl hover:from-teal-100 hover:to-cyan-100 transition-all duration-300 shadow-sm hover:shadow-md border border-teal-100"
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FiCalendar className="text-white" size={20} />
              </div>
              <div>
                <span className="font-semibold text-gray-800 block">Ngày cập nhật</span>
                <p className="font-medium text-gray-900">{formatDate(user.updatedAt)}</p>
              </div>
            </motion.div>

            {/* Premium Status */}
            <motion.div
              className="group md:col-span-2 flex items-center gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 shadow-sm hover:shadow-md border border-indigo-100"
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FiStar className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-gray-800 block">Gói dịch vụ</span>
                <div className="mt-2">
                  {user.premium ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-medium shadow-lg">
                      <FiStar size={14} />
                      Premium ({formatDate(user.premium)})
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full text-sm font-medium shadow-md">
                      Gói thường
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserDetail;