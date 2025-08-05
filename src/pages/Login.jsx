import React from 'react';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock } from 'react-icons/fi';
import { useLogin } from '../hooks/useAuth';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const loginMutation = useLogin();

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-orange-200/30 text-6xl">🍳</div>
        <div className="absolute bottom-20 right-10 text-amber-200/30 text-8xl">👨‍🍳</div>
        <div className="absolute top-1/2 left-20 text-red-200/20 text-5xl">❤️</div>
        <div className="absolute top-32 right-32 text-yellow-200/25 text-4xl">🥘</div>
        <div className="absolute bottom-32 left-32 text-green-200/25 text-4xl">🥗</div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main login card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Header with food theme */}
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-8 text-center relative">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-3">🍴</div>
              <h1 className="text-2xl font-bold text-white mb-2">MÓN NGON MỖI NGÀY</h1>
              <p className="text-orange-100 text-sm">Khám phá thế giới ẩm thực tuyệt vời</p>
            </div>
          </div>

          {/* Login form */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Đăng nhập</h2>
              <p className="text-gray-500 text-sm">Quản lý công thức nấu ăn của bạn</p>
            </div>

            <div className="space-y-6">
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
                    className={`block w-full rounded-2xl pl-12 pr-4 py-4 border-2 transition-all duration-300 bg-gray-50/50 focus:bg-white ${errors.email
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
                    autoComplete="current-password"
                    className={`block w-full rounded-2xl pl-12 pr-4 py-4 border-2 transition-all duration-300 bg-gray-50/50 focus:bg-white ${errors.password
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

              <button
                type="submit"
                onClick={handleSubmit(onSubmit)}
                disabled={loginMutation.isPending}
                className="w-full py-4 px-6 rounded-2xl text-white font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-sm"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>Đang đăng nhập... </span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Đăng nhập
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;