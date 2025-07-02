import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiPieChart, FiBook, FiUsers, FiSettings } from 'react-icons/fi';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <FiPieChart />, path: '/dashboard' },
    { name: 'Công thức', icon: <FiBook />, path: '/recipes' },
    { name: 'Người dùng', icon: <FiUsers />, path: '/users' },
    { name: 'Cài đặt', icon: <FiSettings />, path: '/settings' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white shadow-md fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex-1 flex flex-col pt-5 pb-4">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                  ? 'bg-amber-50 text-amber-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-amber-600'
                }`
              }>
              <div className="mr-3 h-5 w-5">{item.icon}</div>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
