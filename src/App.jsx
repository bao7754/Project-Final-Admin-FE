import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import useAuthStore from './store/authStore';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
// Recipe imports
import CreateRecipe from './pages/Recipe/CreateRecipe';
import RecipeDetail from './pages/Recipe/RecipeDetail';
import RecipeEdit from './pages/Recipe/RecipeEdit';
import Recipes from './pages/Recipe/Recipes';
// Category imports
import Category from './pages/Category/Category';
// User imports
import UserList from './pages/User/User';
import UserDetail from './pages/User/DetailUser';
// Special imports
import AddStep from './pages/Steps/AddSpes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        {isAuthenticated && <Sidebar />}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/categories" element={<Category />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recipes/edit/:id" element={<RecipeEdit />} />
          <Route path="/recipes/create" element={<CreateRecipe />} />
          <Route path="/recipes/:id/add-step" element={<AddStep />} />
        </Routes>
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