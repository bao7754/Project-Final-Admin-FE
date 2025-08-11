import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiHome, FiBook } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png'; 

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide Navbar on login page
  const hideNavbarRoutes = ['/login'];
  if (hideNavbarRoutes.includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActiveRoute = (path) => location.pathname === path;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-amber-100' 
        : 'bg-white shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src={logo} 
                alt="Món Ngon Mỗi Ngày Logo" 
                className="h-15 w-auto group-hover:scale-105 transition-all duration-300" // Increased from h-10 to h-14
              />
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Món Ngon Mỗi Ngày
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              to="/recipes" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActiveRoute('/recipes') 
                  ? 'bg-amber-50 text-amber-700 shadow-sm' 
                  : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <FiBook className="h-4 w-4" />
              <span>Công thức</span>
            </Link>

            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActiveRoute('/dashboard') 
                    ? 'bg-amber-50 text-amber-700 shadow-sm' 
                    : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <span>Dashboard</span>
              </Link>
            )}

            {/* User Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200">
               
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group"
                  title="Đăng xuất"
                >
                  <FiLogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="ml-6 pl-6 border-l border-gray-200">
                <Link
                  to="/login"
                  className="px-6 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
            >
              <div className="relative">
                <FiMenu className={`h-6 w-6 transition-all duration-300 ${isMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
                <FiX className={`h-6 w-6 absolute top-0 left-0 transition-all duration-300 ${isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        isMenuOpen 
          ? 'max-h-96 opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="bg-white/95 backdrop-blur-lg border-t border-amber-100">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                isActiveRoute('/') 
                  ? 'bg-amber-50 text-amber-700' 
                  : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiHome className="h-5 w-5" />
              <span>Trang chủ</span>
            </Link>
            
            <Link
              to="/recipes"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                isActiveRoute('/recipes') 
                  ? 'bg-amber-50 text-amber-700' 
                  : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiBook className="h-5 w-5" />
              <span>Công thức</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  isActiveRoute('/dashboard') 
                    ? 'bg-amber-50 text-amber-700' 
                    : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* Mobile User Section */}
          <div className="px-4 py-4 border-t border-gray-100">
            {isAuthenticated ? (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                    <span className="text-lg font-semibold text-white">
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-800">{user?.username}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center space-x-2 w-full px-4 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                >
                  <FiLogOut className="h-5 w-5" />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block text-center px-6 py-3 rounded-xl text-base font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;