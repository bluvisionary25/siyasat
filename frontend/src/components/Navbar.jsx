import React from 'react';
import SiyasatLogo from './SiyasatLogo';

const Navbar = ({ activePage = 'home', onNavigate, currentUser, onLoginClick }) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdviser = currentUser?.role === 'ADVISER';
  const isElevatedUser = isAdmin || isAdviser;

  const handleNav = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const getInitial = () => {
    if (!currentUser) return 'A';
    if (currentUser.full_name) return currentUser.full_name.charAt(0).toUpperCase();
    if (currentUser.email) return currentUser.email.charAt(0).toUpperCase();
    return 'A';
  };

  return (
    <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
      {/* BRAND LOGO */}
      <div 
        onClick={() => handleNav('home')} 
        className="flex items-center cursor-pointer select-none group transition-transform hover:scale-105"
      >
        <SiyasatLogo variant="maroon" size="md" />
      </div>

      {/* GLASS CAPSULE NAVIGATION BAR */}
      <nav className="flex items-center space-x-1 bg-[#E8E2D9]/70 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/60 shadow-xs text-xs font-semibold">
        <button
          onClick={() => handleNav('home')}
          className={`px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            activePage === 'home'
              ? 'bg-[#F5B842] text-[#800000] font-bold shadow-xs'
              : 'text-[#800000] hover:bg-black/5'
          }`}
        >
          Home
        </button>

        <button
          onClick={() => handleNav('repository')}
          className={`px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            activePage === 'repository'
              ? 'bg-[#F5B842] text-[#800000] font-bold shadow-xs'
              : 'text-[#800000] hover:bg-black/5'
          }`}
        >
          Repository
        </button>

        {isElevatedUser && (
          <button
            onClick={() => handleNav('upload')}
            className={`px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              activePage === 'upload'
                ? 'bg-[#F5B842] text-[#800000] font-bold shadow-xs'
                : 'text-[#800000] hover:bg-black/5'
            }`}
          >
            Upload
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => handleNav('users')}
            className={`px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              activePage === 'users' || activePage === 'accounts'
                ? 'bg-[#F5B842] text-[#800000] font-bold shadow-xs'
                : 'text-[#800000] hover:bg-black/5'
            }`}
          >
            Accounts
          </button>
        )}

        <button
          onClick={() => handleNav('about')}
          className={`px-5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            activePage === 'about'
              ? 'bg-[#F5B842] text-[#800000] font-bold shadow-xs'
              : 'text-[#800000] hover:bg-black/5'
          }`}
        >
          About Us
        </button>
      </nav>

      {/* USER AVATAR / LOGIN BUTTON */}
      <div>
        {currentUser ? (
          <button
            onClick={() => handleNav('profile')}
            className="w-10 h-10 rounded-full bg-[#F5B842] text-white font-bold text-lg flex items-center justify-center shadow-md border-2 border-white/80 cursor-pointer hover:scale-105 transition-all"
            title={currentUser.full_name || currentUser.email}
          >
            {getInitial()}
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-6 py-2 bg-[#800000] hover:bg-[#660000] text-white font-semibold text-xs rounded-full shadow-sm cursor-pointer transition-all"
          >
            Log In
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
