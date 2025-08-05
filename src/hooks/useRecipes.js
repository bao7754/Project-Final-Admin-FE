import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { recipesApi } from '../api';

export const useRecipes = (page = 1, limit = 999) => {
  return useQuery({
    queryKey: ['recipes', page, limit],
    queryFn: async () => {
      try {
        console.log('Fetching recipes for page:', page, 'limit:', limit);
        const response = await recipesApi.getRecipes(page, limit);
        console.log('Recipes API response:', response);
        if (!response || !response.data) {
          console.error(
            'Invalid API response, expected { data: [], pagination: {} }:',
            response
          );
          return { data: [], pagination: { totalPages: 1, currentPage: page } };
        }
        return response;
      } catch (error) {
        console.error(
          'Error fetching recipes:',
          error.response?.data || error.message
        );
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60,
  });
};

export const useRecipe = (id) => {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesApi.getRecipeById(id),
    enabled: !!id,
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        const response = await recipesApi.updateRecipe(id, data);
        console.log('useUpdateRecipe: API response:', response);
        return response;
      } catch (error) {
        console.error('useUpdateRecipe: Mutation failed:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] });
      toast.success('Công thức đã được cập nhật thành công!', {
        position: 'top-right',
        autoClose: 3000,
      });
    },
    onError: (error) => {
      console.error('useUpdateRecipe: Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack,
      });
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Lỗi server không xác định';
      toast.error(`Cập nhật công thức thất bại: ${errorMessage}`, {
        position: 'top-right',
        autoClose: 5000,
      });
    },
  });
};
export const useApproveRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recipesApi.approveRecipe,
    onSuccess: (_, id) => {
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
    mutationFn: async (recipeData) => {
      return await recipesApi.createRecipe(recipeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
      toast.success('Công thức đã được tạo thành công!');
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra khi tạo công thức!';
      toast.error(errorMessage);
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => {
      console.log('Đang gửi request xóa Recipe id:', id);
      return recipesApi.deleteRecipe(id);
    },
    onSuccess: (data, id) => {
      console.log('Xóa thành công Recipe id:', id, 'Response:', data);
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Đã xóa công thức!');
    },
    onError: (error, id) => {
      console.error('Lỗi khi xóa Recipe id:', id, error);
      toast.error('Có lỗi khi xóa công thức!');
    },
  });
};

export const useGetDetailsRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => {
      console.log('Đang gửi request lấy chi tiết Recipe id:', id);
      return recipesApi.getRecipeById(id);
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      toast.success('Đã lấy chi tiết công thức!');
    },
    onError: (error, id) => {
      console.error('Lỗi khi lấy chi tiết Recipe id:', id, error);
      toast.error('Có lỗi khi lấy chi tiết công thức!');
    },
  });
};

export const useAddStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stepData) => recipesApi.addStep(stepData),
    onSuccess: (_, stepData) => {
      queryClient.invalidateQueries({
        queryKey: ['recipe', stepData.recipeId],
      });
      toast.success('Bước đã được thêm thành công!');
    },
    onError: (error) => {
      toast.error(`Có lỗi khi thêm bước: ${error.message}`);
    },
  });
};

export const useRecipeSteps = (recipeId) => {
  return useQuery({
    queryKey: ['recipeSteps', recipeId],
    queryFn: async () => {
      try {
        const data = await recipesApi.getRecipeSteps(recipeId);
        return data;
      } catch (error) {
        // Nếu gặp 404 trả về mảng rỗng (không throw lỗi)
        if (error?.response?.status === 404) {
          console.warn(
            '[useRecipeSteps] 404 Not Found – Không có step nào cho công thức:',
            recipeId
          );
          return [];
        }
        throw error;
      }
    },
    enabled: !!recipeId,
    retry: 1,
    staleTime: 1000 * 60,
    onSuccess: (data) => {
      console.log('[useRecipeSteps] Success:', data);
    },
    onError: (error) => {
      console.error('[useRecipeSteps] Error:', error);
    },
    onSettled: (data, error) => {
      console.log('[useRecipeSteps] Settled:', { data, error });
    },
  });
};

export const useUpdateStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, stepData }) => recipesApi.editStep(stepId, stepData),
    onSuccess: (_, { stepData }) => {
      queryClient.invalidateQueries({
        queryKey: ['recipeSteps', stepData.recipeId],
      });
    },
    onError: (error) => {
      toast.error(`Có lỗi khi cập nhật bước: ${error.message}`);
    },
  });
};
export const useDeleteStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId) => {
      const steps = await recipesApi.getRecipeSteps(recipeId);
      if (!steps || steps.length === 0) {
        return;
      }
      await Promise.all(
        steps.map((step) => {
          return recipesApi.deleteStep(step._id);
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipeSteps'] });
    },
    onError: (error) => {
      console.error('Error in useDeleteRecipeSteps:', error); // Debug log
    },
  });
};
