import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from './Navbar';

const ProfilePage = ({ onNavigate, currentUser, onLogout, onUpdateUser }) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdviser = currentUser?.role === 'ADVISER';
  const isElevatedUser = isAdmin || isAdviser;

  const [profileImage, setProfileImage] = useState(() => {
    return currentUser?.profile_image || null;
  });
  
  const [userWorks, setUserWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('siyasat_token');
      localStorage.removeItem('siyasat_user');
      if (onLogout) onLogout();
      window.location.replace('/');
    }, 800);
  };

  useEffect(() => {
    // Small delay to simulate auth state settlement
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id) {
      fetch(`https://siyasat-backend.onrender.com/api/theses?uploaded_by=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.theses) setUserWorks(data.theses);
        })
        .catch(err => console.error("Error fetching works:", err));
    }
  }, [currentUser]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append('profile_image', file);

      try {
        const token = localStorage.getItem('siyasat_token') || sessionStorage.getItem('siyasat_token');
        const res = await fetch('https://siyasat-backend.onrender.com/api/users/profile-picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.user) {
          localStorage.setItem('siyasat_user', JSON.stringify(data.user));
          setProfileImage(data.user.profile_image);
          if (onUpdateUser) onUpdateUser(data.user);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error('Error uploading image', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!loading && !currentUser) {
    window.location.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] siyasat-contour-lines text-[#800000]  relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-20">

      <Navbar
        activePage="profile"
        onNavigate={onNavigate}
        currentUser={currentUser}
        darkHeader={false}
      />

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10 space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-gray-300 border border-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-3xl font-bold">{currentUser?.full_name ? currentUser.full_name.charAt(0) : ''}</span>
              )}
            </div>
            <label className="mt-3 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-medium rounded-full cursor-pointer">
              Upload profile picture
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#800000]">{currentUser.full_name}</h1>
            <p className="text-sm font-semibold text-[#800000]/80 uppercase tracking-wider">{currentUser.role === 'ADVISER' ? 'Adviser' : currentUser.role}</p>
            <p className="text-sm text-[#800000] font-medium">{currentUser.email}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50/80 px-6 py-3 border-b border-gray-200/80">
            <h2 className="text-xs font-bold text-[#800000] uppercase tracking-wider">Works</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {userWorks.length > 0 ? (
              userWorks.map((work) => (
                <div key={work.id} onClick={() => onNavigate('paper-details', work)} className="p-4 px-6 text-xs md:text-sm font-bold text-gray-800 hover:bg-amber-50/30 cursor-pointer">
                  {work.title}
                </div>
              ))
            ) : (
              <div className="p-4 px-6 text-xs text-gray-500 italic">No uploaded works yet.</div>
            )}
          </div>
        </div>

        <div className="text-right pt-4">
          <button onClick={() => setIsLogoutModalOpen(true)} className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-sm cursor-pointer transition-colors">
            Logout Account
          </button>
        </div>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-gray-900">Are you sure you want to log out?</h3>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-70 transition-colors w-36"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  "Yes, Log Out"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
