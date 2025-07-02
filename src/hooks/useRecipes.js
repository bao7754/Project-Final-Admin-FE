import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { recipesApi } from '../api';

export const useRecipes = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['recipes', page, limit],
    queryFn: () => recipesApi.getRecipes(page, limit),
  });
};

export const useRecipe = (id) => {
  return useQuery({
    queryKey: ['recipe', id], queryFn: () => recipesApi.getRecipeById(id),
    enabled: !!id,
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => recipesApi.updateRecipe(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] }); toast.success('Công thức đã được cập nhật thành công!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi cập nhật công thức!');
    },
  });
};

export const useApproveRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recipesApi.approveRecipe, onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      toast.success('Công thức đã được duyệt thành công!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi duyệt công thức!');
    },
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeData) => recipesApi.createRecipe(recipeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Công thức đã được tạo thành công!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo công thức!';
      toast.error(errorMessage);
    },
  });
};
