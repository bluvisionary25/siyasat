import React from 'react';
import SiyasatLogo from './SiyasatLogo';

const Navbar = ({
  activePage = 'home',
  onNavigate,
  currentUser = null,
  onLoginClick,
  darkHeader = false // Default to false (light background) unless specified e.g. on maroon hero
}) => {
  // If activePage is 'home' and darkHeader is explicitly passed or default true on home
  // but let's be context-aware: if darkHeader is explicitly provided, use it; otherwise, home default to true, others false
  const isDark = darkHeader !== undefined ? darkHeader : activePage === 'home';

  const role = currentUser?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isAdviser = role === 'ADVISER';
  const isElevatedUser = isAdmin || isAdviser;

  const handleNav = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const getInitial = () => {
    if (!currentUser) return '';
    if (currentUser.full_name) return currentUser.full_name.trim().charAt(0).toUpperCase();
    if (currentUser.email) return currentUser.email.trim().charAt(0).toUpperCase();
    return role ? role.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header className="max-w-7xl mx-auto px-6 py-6 relative z-30 flex items-center justify-between">
      {/* 1. LEFT: Brand Logo (pure white on dark/red, deep crimson on light/white) */}
      <div className="flex-1 flex items-center justify-start">
        <div
          onClick={() => handleNav('home')}
          className="cursor-pointer select-none group transition-transform hover:scale-105"
        >
          <SiyasatLogo variant={isDark ? 'white' : 'maroon'} size="md" />
        </div>
      </div>

      {/* 2. CENTER: Horizontally Centered Floating Nav Capsule Pill */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <nav
          className={`flex items-center space-x-1 sm:space-x-2 backdrop-blur-md rounded-full px-2.5 sm:px-3 py-1.5 border shadow-sm text-xs font-semibold transition-colors ${
            isDark
              ? 'bg-white/20 border-white/25 text-white shadow-black/10'
              : 'bg-black/5 sm:bg-gray-100/90 border-gray-200/80 text-[#7A0C0E]'
          }`}
        >
          {/* HOME */}
          <button
            onClick={() => handleNav('home')}
            className={`px-4 sm:px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              activePage === 'home'
                ? isDark
                  ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-xs'
                  : 'bg-[#E59819] text-white font-bold shadow-xs'
                : isDark
                  ? 'text-white/85 hover:text-white hover:bg-white/15'
                  : 'text-gray-700 hover:text-[#7A0C0E] hover:bg-black/5'
            }`}
          >
            Home
          </button>

          {/* REPOSITORY */}
          <button
            onClick={() => handleNav('repository')}
            className={`px-4 sm:px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              activePage === 'repository'
                ? isDark
                  ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-xs'
                  : 'bg-[#E59819] text-white font-bold shadow-xs'
                : isDark
                  ? 'text-white/85 hover:text-white hover:bg-white/15'
                  : 'text-gray-700 hover:text-[#7A0C0E] hover:bg-black/5'
            }`}
          >
            Repository
          </button>

          {/* UPLOAD (Adviser & Admin) */}
          {isElevatedUser && (
            <button
              onClick={() => handleNav('upload')}
              className={`px-4 sm:px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                activePage === 'upload'
                  ? isDark
                    ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-xs'
                    : 'bg-[#E59819] text-white font-bold shadow-xs'
                  : isDark
                    ? 'text-white/85 hover:text-white hover:bg-white/15'
                    : 'text-gray-700 hover:text-[#7A0C0E] hover:bg-black/5'
              }`}
            >
              Upload
            </button>
          )}

          {/* ACCOUNTS (Admin) */}
          {isAdmin && (
            <button
              onClick={() => handleNav('users')}
              className={`px-4 sm:px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                activePage === 'users' || activePage === 'accounts'
                  ? isDark
                    ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-xs'
                    : 'bg-[#E59819] text-white font-bold shadow-xs'
                  : isDark
                    ? 'text-white/85 hover:text-white hover:bg-white/15'
                    : 'text-gray-700 hover:text-[#7A0C0E] hover:bg-black/5'
              }`}
            >
              Accounts
            </button>
          )}

          {/* ABOUT US */}
          <button
            onClick={() => handleNav('about')}
            className={`px-4 sm:px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              activePage === 'about'
                ? isDark
                  ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-xs'
                  : 'bg-[#E59819] text-white font-bold shadow-xs'
                : isDark
                  ? 'text-white/85 hover:text-white hover:bg-white/15'
                  : 'text-gray-700 hover:text-[#7A0C0E] hover:bg-black/5'
            }`}
          >
            About Us
          </button>
        </nav>
      </div>

      {/* 3. RIGHT: Aligned Circular User Avatar / Login Button */}
      <div className="flex-1 flex items-center justify-end">
        {currentUser ? (
          <button
            onClick={() => handleNav('profile')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E59819] text-[#7A0C0E] font-bold text-sm sm:text-base flex items-center justify-center shadow-md border-2 border-white/80 cursor-pointer hover:scale-105 transition-all overflow-hidden"
            title={currentUser.full_name || currentUser.email}
          >
            {currentUser.profile_image ? (
              <img src={`https://siyasat-backend.onrender.com/${currentUser.profile_image}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              getInitial()
            )}
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-5 sm:px-6 py-2 bg-[#E59819] hover:bg-[#d98b0f] text-white font-bold text-xs rounded-full shadow-sm cursor-pointer transition-all"
          >
            Log In
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
