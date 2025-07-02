import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
    staleTime: 1000 * 60 * 10, // 10 phút
  });
};
