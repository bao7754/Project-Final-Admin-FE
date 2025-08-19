import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import useAuthStore from './store/authStore';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CreateRecipe from './pages/Recipe/CreateRecipe';
import RecipeDetail from './pages/Recipe/RecipeDetail';
import RecipeEdit from './pages/Recipe/RecipeEdit';
import Recipes from './pages/Recipe/Recipes';
import Category from './pages/Category/Category';
import UserList from './pages/User/User';
import UserDetail from './pages/User/DetailUser';
import AddStep from './pages/Steps/AddSpes';
import Reviews from './pages/Reviews/Reviews';
import Register from './pages/Register';
import UserDetailLayout from './pages/User/Info';
import PackManagement from './pages/Pack/PackManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  return (
    <>
      {!isPublicRoute && <Navbar />}
      {!isPublicRoute && isAuthenticated && <Sidebar />}
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/info" element={<UserDetailLayout />} />
        <Route path="/packs" element={<PackManagement />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/create" element={<CreateRecipe />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/recipes/edit/:id" element={<RecipeEdit />} />
        <Route path="/recipes/:id/add-step" element={<AddStep />} />
        <Route path="/categories" element={<Category />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/reviews" element={<Reviews />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
};

export default App;