import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import useAuthStore from '../store/authStore';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between h-16">
        <div className="flex items-center">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="text-xl font-bold text-amber-600">Ẩm Thực Việt</span></Link>
        </div><div className="hidden md:flex items-center space-x-4">
          <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50">
            Trang chủ
          </Link><Link to="/recipes" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700hover:text-amber-600 hover:bg-amber-50">
            Công thức
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50">
              Dashboard
            </Link>
          )}
          {isAuthenticated ? (
            <div className="relative ml-3"><div className="flex items-center space-x-3"><span className="text-sm font-medium text-gray-700">{user?.username}</span>  <div className="flex items-center justify-center h-8 w-8rounded-full bg-amber-100 text-amber-800">
              {user?.username.charAt(0).toUpperCase()}
            </div>
              <button onClick={handleLogout}
                className="p-1 rounded-full text-gray-500 hover:text-amber-600 focus:outline-none"
              >
                <FiLogOut className="h-5 w-5" />  </button>
            </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
            >Đăng nhập
            </Link>
          )}</div>
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-500 hover:text-amber-600 hover:bg-gray-100 focus:outline-none"
          >
            {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button></div>
      </div></div>
      {
        isMenuOpen && (<div className="md:hidden">
          <div className="px-2pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-amber-600hover:bg-amber-50" onClick={() => setIsMenuOpen(false)}
            >Trang chủ
            </Link>
            <Link
              to="/recipes"
              className="block px-3py-2 rounded-md text-base font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Công thức
            </Link>

            {isAuthenticated && (<Link
              to="/dashboard"
              className="block px-3 py-2rounded-md text-base font-medium text-gray-700hover:text-amber-600 hover:bg-amber-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            )}</div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10rounded-full bg-amber-100 text-amber-800">
                    {user?.username.charAt(0).toUpperCase()}
                  </div></div><div className="ml-3"><div className="text-base font-medium text-gray-800">{user?.username}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
                <button onClick={handleLogout} className="ml-auto p-1 rounded-full text-gray-500 hover:text-amber-600 focus:outline-none"
                >
                  <FiLogOut className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="px-5">
                <Link to="/login"
                  className="block text-center px-4 py-2rounded-md text-base font-medium text-white bg-amber-600 hover:bg-amber-700" onClick={() => setIsMenuOpen(false)}
                >  Đăng nhập</Link></div>
            )}
          </div>
        </div >
        )
      }
    </nav >
  );
};

export default Navbar;







