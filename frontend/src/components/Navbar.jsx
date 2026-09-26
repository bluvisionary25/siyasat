import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import SiyasatLogo from './SiyasatLogo';

const Navbar = ({
  activePage = 'home',
  onNavigate,
  currentUser = null,
  onLoginClick,
  darkHeader = false // Default to false (light background) unless specified e.g. on maroon hero
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 relative z-30 flex items-center justify-between">
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
      <div className="hidden md:flex flex-shrink-0 items-center justify-center">
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
      <div className="flex-1 flex items-center justify-end space-x-2 sm:space-x-3">
        {currentUser ? (
          <button
            onClick={() => handleNav('profile')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E59819] text-[#7A0C0E] font-bold text-sm sm:text-base flex items-center justify-center shadow-md border-2 border-white/80 cursor-pointer hover:scale-105 transition-all overflow-hidden"
            title={currentUser.full_name || currentUser.email}
          >
            {currentUser.profile_image ? (
              <img src={currentUser.profile_image} alt="Avatar" className="w-full h-full object-cover" />
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

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`block md:hidden p-2 rounded-lg cursor-pointer transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
            isDark ? 'text-white hover:bg-white/10' : 'text-[#7A0C0E] hover:bg-black/5'
          }`}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 4. MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className={`absolute top-full left-4 right-4 sm:left-6 sm:right-6 mt-2 p-4 md:hidden rounded-2xl shadow-xl border backdrop-blur-xl transition-all z-50 ${
            isDark
              ? 'bg-[#7A0C0E]/95 border-white/20 shadow-black/30'
              : 'bg-white/95 border-gray-200/80 shadow-gray-200'
          }`}
        >
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => { handleNav('home'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-5 py-4 rounded-xl text-base font-semibold transition-all ${
                  activePage === 'home'
                    ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-sm'
                    : isDark ? 'text-white/90 hover:text-white hover:bg-white/15' : 'text-gray-800 hover:text-[#7A0C0E] hover:bg-black/5'
                }`}
            >
              Home
            </button>
            <button
              onClick={() => { handleNav('repository'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-5 py-4 rounded-xl text-base font-semibold transition-all ${
                  activePage === 'repository'
                    ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-sm'
                    : isDark ? 'text-white/90 hover:text-white hover:bg-white/15' : 'text-gray-800 hover:text-[#7A0C0E] hover:bg-black/5'
                }`}
            >
              Repository
            </button>
            {isElevatedUser && (
              <button
                onClick={() => { handleNav('upload'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-5 py-4 rounded-xl text-base font-semibold transition-all ${
                    activePage === 'upload'
                      ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-sm'
                      : isDark ? 'text-white/90 hover:text-white hover:bg-white/15' : 'text-gray-800 hover:text-[#7A0C0E] hover:bg-black/5'
                  }`}
              >
                Upload
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => { handleNav('users'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-5 py-4 rounded-xl text-base font-semibold transition-all ${
                    activePage === 'users' || activePage === 'accounts'
                      ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-sm'
                      : isDark ? 'text-white/90 hover:text-white hover:bg-white/15' : 'text-gray-800 hover:text-[#7A0C0E] hover:bg-black/5'
                  }`}
              >
                Accounts
              </button>
            )}
            <button
              onClick={() => { handleNav('about'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-5 py-4 rounded-xl text-base font-semibold transition-all ${
                  activePage === 'about'
                    ? 'bg-[#E59819] text-[#7A0C0E] font-bold shadow-sm'
                    : isDark ? 'text-white/90 hover:text-white hover:bg-white/15' : 'text-gray-800 hover:text-[#7A0C0E] hover:bg-black/5'
                }`}
            >
              About Us
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
