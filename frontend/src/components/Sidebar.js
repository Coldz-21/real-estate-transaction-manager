import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      path: user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent',
      icon: '📊'
    },
    {
      name: 'Create Loop',
      path: '/loops/new',
      icon: '➕'
    }
  ];

  return (
    <div className="sidebar">
      {/* Logo/Brand */}
      <div className="px-6 py-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          Nexus Realty NC
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Loop Manager
        </p>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Quick Stats */}
      <div className="px-6 py-4 border-t border-gray-200 mt-auto">
        <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
        <div className="space-y-2">
          <Link
            to="/loops/new"
            className="block text-sm text-blue-600 hover:text-blue-500"
          >
            + New Transaction Loop
          </Link>
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                // Export functionality can be added here
                console.log('Export all loops');
              }}
              className="block text-sm text-gray-600 hover:text-gray-500 w-full text-left"
            >
              📄 Export All Loops
            </button>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">System</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Status</span>
            <span className="text-green-600 font-medium">● Online</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Version</span>
            <span className="text-gray-700">v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-6 py-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
        >
          <span className="text-lg">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Like dotloop for real estate
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
