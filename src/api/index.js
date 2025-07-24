// src/api/index.js
import axios from 'axios';

const API_URL = 'https://thangphan300724.id.vn';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Using token:', token); // Log token for debugging
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
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

// Recipes API
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
    console.log('[API] Gửi yêu cầu duyệt recipe với id:', id);
    const { data } = await api.patch(`/api/recipes/${id}`);
    console.log('[API] Kết quả trả về:', data);
    return data;
  },

  deleteRecipe: async (id) => {
    console.log('[API] Gửi yêu cầu xóa recipe với id:', id);
    const { data } = await api.delete(`/api/recipes/${id}`);
    console.log('[API] Kết quả trả về:', data);
    return data;
  },

  createRecipe: async (recipeData) => {
    console.log('[API] Gửi data:', recipeData);
    const { data } = await api.post('/api/recipes', recipeData);
    console.log('[API] Nhận về:', data);
    return data;
  },

  getRecipeSteps: async (recipeId) => {
    const { data } = await api.get(`/api/steps/recipe/${recipeId}`);
    return data;
  },

  addStep: async (stepData) => {
    // Đúng route /api/steps/ theo RESTful
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

export const favoritesApi ={
  getFavoriteApi: async () => {
    const {data} = await api.get('/api/favorites');
    return data
  }
}