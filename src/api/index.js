// src/api/index.js
import axios from 'axios';

const API_URL = 'https://thangphan300724.id.vn';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
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
  }, (error) => Promise.reject(error)
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
    const { data } = await api.get('/api/auth/me');
    return data;
  }
};

// Recipes API
export const recipesApi = {
  getRecipes: async (page = 1, limit = 10) => {
    const { data } = await api.get(`/api/recipes/?page=${page}&limit=${limit}`);
    return data;
  },

  getRecipeById: async (id) => {
    const { data } = await api.get(`/api/recipes/${id}`); return data;
  }, updateRecipe: async (id, updateData) => {
    const { data } = await api.put(`/api/recipes/${id}`, updateData);
    return data;
  },

  approveRecipe: async (id) => {
    const { data } = await api.patch(`/api/recipes/${id}`);
    return data;
  },

  createRecipe: async (recipeData) => {
    const { data } = await api.post('/api/recipes', recipeData);
    return data;
  }
};

export const categoriesApi = {
  getCategories: async () => {
    const { data } = await api.get('/api/categories/');
    return data;
  }
};
