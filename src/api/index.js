import axios from 'axios';

const API_URL = 'https://thangphan300724.id.vn';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const authApi = {
  login: async (credentials) => {
    const { data } = await api.post('/api/admins/login', credentials);
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/api/admins');
    return data;
  },
  getUserById: async (id) => {
    const { data } = await api.get(`/api/admins/${id}`);
    return data;
  },
};

export const recipesApi = {
  getRecipes: async (page = 1, limit = 10) => {
    const { data } = await api.get(`/api/recipes/?page=${page}&limit=${limit}`);
    return data;
  },

  getRecipeById: async (id) => {
    const { data } = await api.get(`/api/recipes/read/${id}`);
    return data;
  },
  updateRecipe: async (id, updateData) => {
    const { data } = await api.put(`/api/recipes/${id}`, updateData);
    return data;
  },

  approveRecipe: async (id) => {
    const { data } = await api.patch(`/api/recipes/${id}`);
    return data;
  },

  deleteRecipe: async (id) => {
    const { data } = await api.delete(`/api/recipes/${id}`);
    return data;
  },
   getRecipeId: async (recipeId) => {
    if (!recipeId) {
      throw new Error('Recipe ID is required');
    }
    try {
      const { data } = await api.get(`/api/recipes/read/${recipeId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }),
        },
      });
      return data;
    } catch (error) {
      // ...error handling...
      throw new Error(
        error.response?.data?.message ||
        (error.response?.status === 404
          ? '404'
          : error.message || 'Lỗi không xác định')
      );
    }
  },

  getRecipeSteps: async (recipeId) => {
    const { data } = await api.get(`/api/steps/recipe/${recipeId}`);
    return data;
  },

  addStep: async (stepData) => {
    const { data } = await api.post('/api/steps/', stepData);
    return data;
  },
  editStep: async (stepId, stepData) => {
    const { data } = await api.put(`/api/steps/${stepId}`, stepData);
    return data;
  },
  deleteStep: async (stepId) => {
    const { data } = await api.delete(`/api/steps/${stepId}`);
    return data;
  },

  getReviews: async () => {
    const { data } = await api.get(`/api/reviews`);
    return data;
  },
  deleteReview: async (id) => {
    const { data } = await api.delete(`/api/reviews/${id}`);
    return data;
  },
};

export const categoriesApi = {
  getCategories: async () => {
    const { data } = await api.get('/api/categories/');
    return data;
  },
  updateCategory: async (id, updateData) => {
    const { data } = await api.put(`/api/categories/${id}`, updateData);
    return data;
  },

  createCategory: async (recipeData) => {
    const { data } = await api.post('/api/categories', recipeData);
    return data;
  },
  deleteCategory: async (id) => {
    const { data } = await api.delete(`/api/categories/${id}`);
    return data;
  },
};

export const favoritesApi = {
  getFavoriteApi: async () => {
    const { data } = await api.get('/api/favorites');
    return data;
  },
};

export const mediaApi = {
  createImage: async (formData) => {
    try {
      const { data } = await api.post('/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      throw error;
    }
  },
};

export const premiumUsers = {
  premiumUsers: async () => {
    const { data } = await api.get('/api/admins/analytics');
    return data;
  },
};
