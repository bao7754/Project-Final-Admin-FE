import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { useRegister } from '../hooks/useAuth';

const Register = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const registerMutation = useRegister();
  const [showSlogan, setShowSlogan] = useState(false);

  const password = watch('password'); 

  const onSubmit = (data) => {
    setShowSlogan(true);
  
    setTimeout(() => {
      setShowSlogan(false);
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...submitData } = data;
      registerMutation.mutate(submitData);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-orange-200/30 text-6xl">🍳</div>
        <div className="absolute bottom-20 right-10 text-amber-200/30 text-8xl">👨‍🍳</div>
        <div className="absolute top-1/2 left-20 text-red-200/20 text-5xl">❤️</div>
        <div className="absolute top-32 right-32 text-yellow-200/25 text-4xl">🥘</div>
        <div className="absolute bottom-32 left-32 text-green-200/25 text-4xl">🥗</div>
      </div>
      {showSlogan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 mx-4 max-w-md w-full shadow-2xl border-4 border-orange-500 animate-pulse">
            <div className="text-center">
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-8 text-center relative">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-3">🍴</div>
              <h1 className="text-2xl font-bold text-white mb-2">MÓN NGON MỖI NGÀY</h1>
              <p className="text-orange-100 text-sm">Khám phá thế giới ẩm thực tuyệt vời</p>
            </div>
          </div>
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Đăng ký tài khoản</h2>
              <p className="text-gray-500 text-sm">Tạo tài khoản để quản lý công thức nấu ăn</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👤 Họ và tên
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <FiUser className="h-5 w-5" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className={`block w-full rounded-2xl pl-12 pr-4 py-4 border-2 transition-all duration-300 bg-gray-50/50 focus:bg-white ${
                      errors.name
                        ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                    } placeholder-gray-400 text-gray-900 focus:outline-none text-sm font-medium`}
                    placeholder="Nguyễn Văn A"
                    {...register('name', {
                      required: 'Họ và tên là bắt buộc',
                      minLength: {
                        value: 2,
                        message: 'Họ và tên phải có ít nhất 2 ký tự',
                      },
                    })}
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <span>❌</span>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <FiMail className="h-5 w-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full rounded-2xl pl-12 pr-4 py-4 border-2 transition-all duration-300 bg-gray-50/50 focus:bg-white ${
                      errors.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                    } placeholder-gray-400 text-gray-900 focus:outline-none text-sm font-medium`}
                    placeholder="chef@cookbook.com"
                    {...register('email', {
                      required: 'Email là bắt buộc',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email không hợp lệ',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <span>❌</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔒 Mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <FiLock className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className={`block w-full rounded-2xl pl-12 pr-4 py-4 border-2 transition-all duration-300 bg-gray-50/50 focus:bg-white ${
                      errors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                    } placeholder-gray-400 text-gray-900 focus:outline-none text-sm font-medium`}
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'Mật khẩu là bắt buộc',
                      minLength: {
                        value: 6,
                        message: 'Mật khẩu phải có ít nhất 6 ký tự',
                      },
                    })}
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <span>❌</span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔒 Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <FiLock className="h-5 w-5" />
                  </span>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`block w-full rounded-2xl pl-12 pr-4 py-4 border-2 transition-all duration-300 bg-gray-50/50 focus:bg-white ${
                      errors.confirmPassword
                        ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
                    } placeholder-gray-400 text-gray-900 focus:outline-none text-sm font-medium`}
                    placeholder="••••••••"
                    {...register('confirmPassword', {
                      required: 'Xác nhận mật khẩu là bắt buộc',
                      validate: (value) =>
                        value === password || 'Mật khẩu xác nhận không khớp',
                    })}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <span>❌</span>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending || showSlogan}
                className="w-full py-4 px-6 rounded-2xl text-white font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-sm"
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>Đang tạo tài khoản... </span>
                  </span>
                ) : showSlogan ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>Đang xử lý... </span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Tạo tài khoản
                  </span>
                )}
              </button>
            </form>
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">hoặc</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                Đã có tài khoản?
              </p>
              <a
                href="/login"
                className="w-full inline-block py-3 px-6 rounded-2xl text-orange-600 font-bold bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                Đăng nhập ngay
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;