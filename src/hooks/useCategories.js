import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { categoriesApi } from '../api';

export const useCategories = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['categories', page, limit],
    queryFn: () => categoriesApi.getCategories(page, limit),
    staleTime: 1000 * 60 * 10, 
  });
};

// Lấy chi tiết 1 category
export const useCategory = (id) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getCategoryById(id),
    enabled: !!id,
  });
};

// Tạo mới category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryData) => categoriesApi.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã tạo danh mục thành công!');
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || 'Có lỗi khi tạo danh mục!';
      toast.error(errorMessage);
    },
  });
};

// Sửa category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }) => categoriesApi.updateCategory(id, { name }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] });
      toast.success('Đã cập nhật danh mục thành công!');
    },
    onError: () => {
      toast.error('Có lỗi khi cập nhật danh mục!');
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // mutationFn đúng là deleteCategory
    mutationFn: (id) => {
      console.log('Đang gửi request xóa category id:', id);
      return categoriesApi.deleteCategory(id);
    },
    onSuccess: (data, id) => {
      console.log('Xóa thành công category id:', id, 'Response:', data);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Đã xóa danh mục!');
    },
    onError: (error, id) => {
      console.error('Lỗi khi xóa category id:', id, error);
      toast.error('Có lỗi khi xóa danh mục!');
    },
  });
};
