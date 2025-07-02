import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi } from '../api';
import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, token, setAuth, logout, isAuthenticated } = useAuthStore();
  console.log("Token in useAuth:", token);
  const { data, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!token && !user,
    retry: false,
    onSuccess: (data) => {
      if (data && !user) {
        setAuth(data, token || '');
      }
    },
    onError: () => {
      if (isAuthenticated) {
        logout();
      }
    }
  }); return { user, isLoading, isAuthenticated, logout };
};

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials), onSuccess: (data) => {
      console.log("Login success, data:", data);
      setAuth(data.user, data.token);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
    }
  });
};

