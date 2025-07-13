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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-amber-600">Đăng nhập</h2>
          <p className="text-gray-500 text-sm mt-2">Quản lý công thức nấu ăn của bạn</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <FiMail className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`block w-full rounded-lg pl-10 pr-3 py-2 border transition-all duration-200 bg-gray-50 focus:bg-white ${errors.email
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-200 focus:border-amber-500'
                  } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-0 sm:text-sm`}
                placeholder="Email"
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
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <FiLock className="h-5 w-5" />
              </span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`block w-full rounded-lg pl-10 pr-3 py-2 border transition-all duration-200 bg-gray-50 focus:bg-white ${errors.password
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-200 focus:border-amber-500'
                  } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-0 sm:text-sm`}
                placeholder="Mật khẩu"
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
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-2 px-4 rounded-lg text-white font-semibold bg-amber-500 hover:bg-amber-600 transition-all duration-150 shadow-md active:scale-95 disabled:opacity-60"
          >
            {loginMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Đang xử lý...
              </span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
