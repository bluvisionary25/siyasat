import React, { useState } from 'react';

const ProfilePage = ({ onNavigate, currentUser, onLogout }) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdviser = currentUser?.role === 'ADVISER';
  const isElevatedUser = isAdmin || isAdviser;

  const [profileImage, setProfileImage] = useState(null);

  const adviserWorks = [
    { id: 1, title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing' },
    { id: 2, title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing' },
    { id: 3, title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing' }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-gray-800 font-sans relative overflow-hidden selection:bg-[#800000] selection:text-white">
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #800000 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div onClick={() => onNavigate('home')} className="flex items-center space-x-2 cursor-pointer">
          <span className="text-2xl font-black tracking-wider uppercase font-serif text-[#800000]">SIYASAT</span>
        </div>

        <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-md rounded-full px-5 py-1.5 border border-gray-200/80 shadow-sm text-sm font-medium">
          <button onClick={() => onNavigate('home')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] cursor-pointer">Home</button>
          <button onClick={() => onNavigate('repository')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] cursor-pointer">Repository</button>
          {isElevatedUser && (
            <button onClick={() => onNavigate('upload')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] cursor-pointer">Upload</button>
          )}
          {isAdmin && (
            <button onClick={() => onNavigate('users')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] cursor-pointer">Accounts</button>
          )}
          <button onClick={() => onNavigate('about')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] cursor-pointer">About Us</button>
        </div>

        <div>
          <button onClick={() => onNavigate('profile')} className="w-9 h-9 rounded-full bg-[#F5B842] text-[#800000] font-bold text-base flex items-center justify-center shadow-md border border-[#d99e2b] cursor-pointer">
            {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10 space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-gray-300 border border-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-3xl font-bold">{currentUser?.full_name ? currentUser.full_name.charAt(0) : 'M'}</span>
              )}
            </div>
            <label className="mt-3 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-medium rounded-full cursor-pointer">
              Upload profile picture
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#800000]">{currentUser?.full_name || 'Maria B. Santos'}</h1>
            <p className="text-sm font-semibold text-gray-700">{currentUser?.role === 'ADVISER' ? 'Adviser' : currentUser?.role || 'Adviser'}</p>
            <p className="text-sm text-[#800000] font-medium">{currentUser?.email || 'santos.maria@clsu2.edu.ph'}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50/80 px-6 py-3 border-b border-gray-200/80">
            <h2 className="text-xs font-bold text-[#800000] uppercase tracking-wider">Works</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {adviserWorks.map((work) => (
              <div key={work.id} onClick={() => onNavigate('paper-details')} className="p-4 px-6 text-xs md:text-sm font-bold text-gray-800 hover:bg-amber-50/30 cursor-pointer">
                {work.title}
              </div>
            ))}
          </div>
        </div>

        <div className="text-right pt-4">
          <button onClick={onLogout} className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-sm cursor-pointer">
            Logout Account
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;