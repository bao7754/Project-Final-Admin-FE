import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { mediaApi } from '../api';

export const useUploadImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData) => mediaApi.createImage(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error) => {
      let errorMessage = 'Có lỗi khi upload ảnh!';
      
      if (error?.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(', ');
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error?.request && !error?.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      if (error?.response?.status) {
        switch (error.response.status) {
          case 400:
            errorMessage = `Dữ liệu không hợp lệ: ${errorMessage}`;
            break;
          case 401:
            errorMessage = 'Không có quyền truy cập. Vui lòng kiểm tra đăng nhập!';
            break;
          case 403:
            errorMessage = 'Truy cập bị từ chối!';
            break;
          case 404:
            errorMessage = 'Không tìm thấy endpoint upload!';
            break;
          case 413:
            errorMessage = 'File quá lớn! Vui lòng chọn file nhỏ hơn.';
            break;
          case 415:
            errorMessage = 'Định dạng file không được hỗ trợ!';
            break;
          case 422:
            errorMessage = `Dữ liệu không hợp lệ: ${errorMessage}`;
            break;
          case 500:
            errorMessage = 'Lỗi server nội bộ. Vui lòng thử lại sau!';
            break;
          default:
            errorMessage = `Lỗi ${error.response.status}: ${errorMessage}`;
        }
      }
      
      toast.error(errorMessage);
    },
  });
};