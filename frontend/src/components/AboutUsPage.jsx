import React from 'react';

const AboutUsPage = ({ onNavigate, currentUser, onLogout }) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdviser = currentUser?.role === 'ADVISER';
  const isElevatedUser = isAdmin || isAdviser;

  return (
    <div className="min-h-screen bg-[#faf8f6] text-gray-800 font-sans relative overflow-hidden selection:bg-[#800000] selection:text-white">
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #800000 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* ------------------ TOP NAVIGATION ------------------ */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div onClick={() => onNavigate('home')} className="flex items-center space-x-2 cursor-pointer">
          <span className="text-2xl font-black tracking-wider uppercase font-serif text-[#800000]">
            SIYASAT
          </span>
        </div>

        <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-md rounded-full px-5 py-1.5 border border-gray-200/80 shadow-sm text-sm font-medium">
          <button onClick={() => onNavigate('home')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] transition-all cursor-pointer">
            Home
          </button>
          <button onClick={() => onNavigate('repository')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] transition-all cursor-pointer">
            Repository
          </button>
          {isElevatedUser && (
            <button onClick={() => onNavigate('upload')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] transition-all cursor-pointer">
              Upload
            </button>
          )}
          {isAdmin && (
            <button onClick={() => onNavigate('users')} className="px-4 py-1.5 rounded-full text-gray-600 hover:text-[#800000] transition-all cursor-pointer">
              Accounts
            </button>
          )}
          <button onClick={() => onNavigate('about')} className="px-4 py-1.5 rounded-full bg-[#F5B842] text-[#800000] font-semibold transition-all cursor-pointer shadow-sm">
            About Us
          </button>
        </div>

        <div>
          {currentUser ? (
            <button 
              onClick={() => onNavigate('profile')}
              className="w-9 h-9 rounded-full bg-[#F5B842] text-[#800000] font-bold text-base flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer border border-[#d99e2b]"
            >
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
            </button>
          ) : (
            <button onClick={() => onNavigate('login')} className="text-xs bg-[#800000] text-white px-4 py-2 rounded-full cursor-pointer font-medium">
              Log In
            </button>
          )}
        </div>
      </header>

      {/* ------------------ MAIN CONTENT ------------------ */}
      <main className="max-w-4xl mx-auto px-6 py-8 relative z-10 space-y-10">
        <div className="text-center space-y-1">
          <p className="text-lg md:text-xl font-semibold text-[#800000]">The Department of</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#800000] tracking-tight">
            Agricultural and Biosystems Engineering
          </h1>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-[#800000]">Mission</h2>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            To provide engineering and technology expertise in the field of agriculture and affiliated industries for the country, the region, and beyond.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-[#800000]">Objectives</h2>
          <ul className="space-y-2 text-sm md:text-base text-gray-700 leading-relaxed pl-2">
            <li className="flex items-start"><span className="mr-2.5 text-[#800000] font-bold">•</span><span>To develop relevant and quality curricular programs of the department.</span></li>
            <li className="flex items-start"><span className="mr-2.5 text-[#800000] font-bold">•</span><span>To produce quality graduates of the programs offered by the department within the allowable residencies.</span></li>
            <li className="flex items-start"><span className="mr-2.5 text-[#800000] font-bold">•</span><span>To generate innovative technologies and systems for the production and post-production of safe and secure food.</span></li>
            <li className="flex items-start"><span className="mr-2.5 text-[#800000] font-bold">•</span><span>To provide engineering and technology expertise in the field of agriculture.</span></li>
          </ul>
        </section>

        <section className="space-y-6 pt-2">
          <h2 className="text-xl md:text-2xl font-bold text-[#800000]">Areas of Specialization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white/70 border border-gray-200/80 rounded-3xl p-8 flex items-center justify-center text-center shadow-sm min-h-[140px]">
              <h3 className="text-base md:text-lg font-bold text-[#800000] leading-snug">AB Machinery and<br />Power Engineering</h3>
            </div>
            <div className="bg-white/70 border border-gray-200/80 rounded-3xl p-8 flex items-center justify-center text-center shadow-sm min-h-[140px]">
              <h3 className="text-base md:text-lg font-bold text-[#e0a635] leading-snug">AB Land and Water<br />Resources Engineering</h3>
            </div>
            <div className="bg-white/70 border border-gray-200/80 rounded-3xl p-8 flex items-center justify-center text-center shadow-sm min-h-[140px]">
              <h3 className="text-base md:text-lg font-bold text-[#e0a635] leading-snug">AB Structures and<br />Environment Engineering</h3>
            </div>
            <div className="bg-white/70 border border-gray-200/80 rounded-3xl p-8 flex items-center justify-center text-center shadow-sm min-h-[140px]">
              <h3 className="text-base md:text-lg font-bold text-[#800000] leading-snug">AB Process<br />Engineering</h3>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutUsPage;