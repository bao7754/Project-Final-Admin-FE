/* eslint-disable react-hooks/rules-of-hooks */
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { packApi } from '../api';

export const getPacks = () => {
    return useQuery({
        queryKey: ['packs'],
        queryFn: packApi.getPacks,
        retry: false,
        onError: (error) => {
            console.error('Error fetching packs:', error);
            toast.error('Không thể tải gói. Vui lòng thử lại sau.');
        }
    });
};

