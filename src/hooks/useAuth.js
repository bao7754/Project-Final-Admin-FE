import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi, premiumUsers } from '../api';
import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, token, setAuth, logout, isAuthenticated } = useAuthStore();
  console.log('Token in useAuth:', token);
  const { isLoading } = useQuery({
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
    },
  });
  return { user, isLoading, isAuthenticated, logout };
};

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: (data) => {
      console.log('Login success, data:', data);
      
      const user = data.admin || data.user || { email: data.email };
      console.log('User data:', user);
      
      // Lưu thông tin auth vào store
      setAuth(user, data.token);
      
      // Lưu token và user ID vào localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', user.id);
      
      // Optional: Lưu thêm thông tin user khác nếu cần
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', data.admin ? 'admin' : 'user');
      
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
    },
  });
};
export const useRegister = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (userData) => authApi.register(userData),
    onSuccess: (data) => {
      console.log('Register success, data:', data);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    },

    onError: () => {
      toast.error('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin đăng ký.');
    },
  });
};

export const useUsers = async () => {
  try {
    const response = await authApi.getCurrentUser();
    console.log('Current user API raw response:', response);
    if (response?.data) {
      console.log('Current user DATA:', response.data);
      return response.data;
    }
    return response;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const useUserDetail = (id) => {
  return useQuery({
    queryKey: ['userDetail', id],
    queryFn: async () => {
      const res = await authApi.getUserById(id);
      console.log('User detail API raw response:', res);
      return res;
    },
    enabled: !!id,
    retry: false,
    onError: (error) => {
      console.error('Error fetching user detail:', error);
      throw error;
    },
  });
};

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: ({ id, userData }) => authApi.updateUser(id, userData),
    onSuccess: (data) => {
      console.log('Update user success, data:', data);
      toast.success('Cập nhật thông tin thành công!');
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast.error('Cập nhật thông tin thất bại: ' + (error.response?.data?.message || error.message));
    },
  });
};

export const usepremiumUsers = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery({
    queryKey: ['premium'],
    queryFn: () => premiumUsers.premiumUsers(),
  });
};

export const useAnalyticsPremium = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery({
    queryKey: ['analyticsPremium'],
    queryFn: () => premiumUsers.analyticsPremium(),
  });
}
