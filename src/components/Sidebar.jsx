import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiPieChart, FiBook, FiUsers, FiLogOut, FiStar } from 'react-icons/fi';
import useAuthStore from '../../src/store/authStore';

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Hiển thị confirm dialog
      const confirmLogout = window.confirm('Bạn có chắc muốn đăng xuất không?');

      if (confirmLogout) {
        // Thực hiện đăng xuất
        await logout();

        // Chuyển hướng về trang đăng nhập
        navigate('/login', { replace: true });

        // Hiển thị thông báo thành công (tuỳ chọn)
        // toast.success('Đã đăng xuất thành công!');
      }
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      // Hiển thị thông báo lỗi (tuỳ chọn)
      // toast.error('Có lỗi xảy ra khi đăng xuất!');
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: <FiPieChart />, path: '/dashboard', type: 'link' },
    { name: 'Danh mục', icon: <FiHome />, path: '/categories', type: 'link' },
    { name: 'Công thức', icon: <FiBook />, path: '/recipes', type: 'link' },
    { name: 'Đánh giá', icon: <FiStar />, path: '/reviews', type: 'link' },
    { name: 'Người dùng', icon: <FiUsers />, path: '/users', type: 'link' },

    { name: 'Đăng xuất', icon: <FiLogOut />, path: '#', type: 'action', action: handleLogout },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white shadow-md fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex-1 flex flex-col pt-5 pb-4">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {menuItems.map((item) => {
            // Nếu là action (như đăng xuất)
            if (item.type === 'action') {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                >
                  <div className="mr-3 h-5 w-5">{item.icon}</div>
                  {item.name}
                </button>
              );
            }

            // Nếu là link thông thường
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive
                    ? 'bg-amber-50 text-amber-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-amber-600'
                  }`
                }
              >
                <div className="mr-3 h-5 w-5">{item.icon}</div>
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;