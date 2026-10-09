import React from 'react';
import { HopeScanLogo, LogoutIcon } from './icons.jsx';

const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HopeScanLogo className="h-8 w-auto" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 ml-3">HopeScan</h1>
          </div>
          <div className="flex items-center">
            <p className="text-sm text-gray-600 mr-4">
              Welcome, <span className="font-semibold">{user.name}</span> ({user.role})
            </p>
            <button
              onClick={onLogout}
              className="flex items-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <LogoutIcon className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

