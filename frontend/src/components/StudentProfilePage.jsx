import React from 'react';
import { LogOut, BookOpen, Search } from 'lucide-react';

const StudentProfilePage = ({ currentUser, onNavigate, onLogout }) => {
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#800000] font-sans relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-16">
            {/* Background Radial Texture */}
            <div
                className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
                style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, #800000 1px, transparent 1px)`,
                    backgroundSize: '28px 28px'
                }}
            />

            {/* TOP HEADER NAVBAR */}
            <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
                <div onClick={() => onNavigate('home')} className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-3xl font-black tracking-wider uppercase font-serif text-[#800000]">SIYASAT</span>
                </div>

                <div className="flex items-center space-x-1 bg-[#EFECE6]/80 backdrop-blur-md rounded-full px-4 py-1.5 border border-gray-200 text-xs font-semibold text-gray-700">
                    <button onClick={() => onNavigate('home')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Home</button>
                    <button onClick={() => onNavigate('repository')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Repository</button>
                    <button onClick={() => onNavigate('about')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">About Us</button>
                </div>

                <div>
                    <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-[#F5B842] text-white font-bold text-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-90">
                        {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'S'}
                    </button>
                </div>
            </header>

            {/* STUDENT PROFILE CONTAINER */}
            <main className="max-w-3xl mx-auto px-6 pt-6 relative z-10 space-y-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#800000] text-center tracking-tight">
                    Student Profile
                </h1>

                {/* PROFILE CARD */}
                <div className="bg-[#EFECE6]/50 border border-gray-200 rounded-3xl p-8 shadow-2xs space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-200/80">
                        <div className="flex items-center space-x-5">
                            <div className="w-16 h-16 rounded-full bg-[#800000] text-[#F5B842] font-black text-2xl flex items-center justify-center shadow-md">
                                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#800000]">{currentUser?.full_name || 'Student User'}</h2>
                                <p className="text-xs text-gray-600 font-medium">{currentUser?.email || 'student@clsu.edu.ph'}</p>
                                <span className="inline-block mt-2 px-3 py-0.5 bg-[#F5B842] text-[#800000] text-[10px] font-extrabold uppercase rounded-full">
                                    Student
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-2 px-5 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-full cursor-pointer hover:bg-rose-100 transition-all"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Log Out</span>
                        </button>
                    </div>

                    {/* QUICK ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <button
                            onClick={() => onNavigate('repository')}
                            className="flex items-center space-x-3 p-4 bg-white/80 border border-gray-200 rounded-2xl hover:border-[#800000]/40 transition-all text-left cursor-pointer"
                        >
                            <div className="p-2.5 bg-[#800000]/10 text-[#800000] rounded-xl">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-[#800000]">Explore Repository</h3>
                                <p className="text-[11px] text-gray-600">Browse and search research papers</p>
                            </div>
                        </button>

                        <button
                            onClick={() => onNavigate('repository')}
                            className="flex items-center space-x-3 p-4 bg-white/80 border border-gray-200 rounded-2xl hover:border-[#800000]/40 transition-all text-left cursor-pointer"
                        >
                            <div className="p-2.5 bg-[#F5B842]/20 text-[#800000] rounded-xl">
                                <Search className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-[#800000]">AI Gap Analysis</h3>
                                <p className="text-[11px] text-gray-600">Analyze research gaps in theses</p>
                            </div>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentProfilePage;