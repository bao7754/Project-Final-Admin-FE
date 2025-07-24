// hooks/useFavorites.js
import { useQuery } from '@tanstack/react-query';
import { favoritesApi } from '../api';

export const useFavorites = () => {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getFavoriteApi(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};