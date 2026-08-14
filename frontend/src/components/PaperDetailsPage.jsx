import React, { useState } from 'react';
import { Download, Edit3, Trash2 } from 'lucide-react';

const PaperDetailsPage = ({ paper, onNavigate, currentUser, onDeletePaper }) => {
  // Check if current user is an Admin
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin';
  const isAdviser = currentUser?.role === 'ADVISER' || currentUser?.role === 'Adviser';
  const isElevatedUser = isAdmin || isAdviser;

  const [downloading, setDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const defaultPaper = {
    id: 1,
    title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
    authors: 'Dela Cruz, Juan A.\nDownie, Hailie Nichole\nJapson, Althea Myr',
    dateAccepted: 'July 31, 2026',
    branch: 'Land and Water Resources Engineering',
    abstract: `Postharvest losses in rice production remain a significant challenge in the Philippines, particularly due to inefficient and weather-dependent drying methods such as open sun drying. This study aimed to design, fabricate, and evaluate the performance of a solar-powered grain dryer intended for small- to medium-scale rice postharvest processing. The dryer was constructed using a solar collector, drying chamber, and auxiliary blower system to enhance airflow and heat distribution. Performance evaluation was conducted by measuring drying time, moisture reduction rate, drying efficiency, and grain quality parameters such as milling recovery and broken grain percentage, and comparing these against conventional sun-drying methods. Results showed that the solar-powered dryer significantly reduced drying time while maintaining higher grain quality and lower broken grain percentage compared to traditional sun drying. The study also assessed the system's cost-effectiveness and potential for adoption among small-scale farmers. Findings suggest that the developed solar dryer offers a viable, low-cost alternative for improving postharvest rice processing, reducing losses, and supporting sustainable agricultural practices in rural farming communities.`
  };

  const p = paper || defaultPaper;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
    }, 3000);
  };

  const handleConfirmDelete = async () => {
    if (onDeletePaper) {
      await onDeletePaper(p.id);
    }
    setShowDeleteModal(false);
    onNavigate('repository');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#800000] font-sans relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-16">
      {/* Background Subtle Contour Pattern */}
      <div 
        className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #800000 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      {/* TOP DOWNLOAD IN PROGRESS TOAST NOTIFICATION */}
      {downloading && (
        <div className="fixed top-5 right-28 z-50 bg-white/95 backdrop-blur-md px-5 py-1.5 rounded-full border border-gray-200 shadow-md text-xs font-semibold text-[#800000] flex items-center space-x-1.5 animate-bounce">
          <Download className="w-3.5 h-3.5 text-[#800000]" />
          <span>Download in progress</span>
        </div>
      )}

      {/* TOP HEADER NAVIGATION */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div onClick={() => onNavigate('home')} className="flex items-center space-x-2 cursor-pointer">
          <span className="text-3xl font-black tracking-wider uppercase font-serif text-[#800000]">SIYASAT</span>
        </div>

        <div className="flex items-center space-x-1 bg-[#EFECE6]/80 backdrop-blur-md rounded-full px-4 py-1.5 border border-gray-200 text-xs font-semibold text-gray-700">
          <button onClick={() => onNavigate('home')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Home</button>
          <button onClick={() => onNavigate('repository')} className="px-5 py-1.5 rounded-full bg-[#F5B842] text-[#800000] font-bold shadow-xs cursor-pointer">Repository</button>
          {isElevatedUser && (
            <button onClick={() => onNavigate('upload')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Upload</button>
          )}
          {isAdmin && (
            <button onClick={() => onNavigate('users')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Accounts</button>
          )}
          <button onClick={() => onNavigate('about')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">About Us</button>
        </div>

        <div>
          <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-[#F5B842] text-white font-bold text-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-90">
            {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
          </button>
        </div>
      </header>

      {/* MAIN PAPER CONTENT */}
      <main className="max-w-6xl mx-auto px-6 pt-6 relative z-10 space-y-8">
        <h1 className="text-xl md:text-2xl font-extrabold text-[#800000] text-center leading-snug max-w-4xl mx-auto tracking-tight">
          {p.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative">
          
          {/* LEFT ABSTRACT COLUMN */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#800000]">Abstract</h2>

              {/* ACTION BUTTONS (Download, Edit, Delete) */}
              <div className="flex items-center space-x-4 text-xs font-bold text-[#800000]">
                {/* Download Button */}
                <button 
                  onClick={handleDownload} 
                  className="flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#800000]" />
                  <span>Download</span>
                </button>

                {/* Edit Button (Admin Only) */}
                {isAdmin && (
                  <button 
                    onClick={() => onNavigate('edit-paper')} 
                    className="flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#800000]" />
                    <span>Edit</span>
                  </button>
                )}

                {/* Delete Button (Admin Only) */}
                {isAdmin && (
                  <button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="flex items-center gap-1 hover:underline cursor-pointer text-[#800000]"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#800000]" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-700 leading-relaxed text-justify whitespace-pre-line">
              {p.abstract}
            </p>
          </div>

          {/* RIGHT SIDEBAR META INFORMATION */}
          <div className="md:col-span-4 bg-[#EFECE6]/50 border border-gray-200/80 rounded-3xl p-8 space-y-6 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-[#800000] mb-2">Author/s</h3>
              <p className="text-xs text-[#800000] font-medium whitespace-pre-line leading-relaxed">
                {p.authors || p.author || 'Dela Cruz, Juan A.\nDownie, Hailie Nichole\nJapson, Althea Myr'}
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#800000] mb-1">Date Accepted</h3>
              <p className="text-xs text-[#800000] font-medium">
                {p.dateAccepted || (p.year ? `July 31, ${p.year}` : 'July 31, 2026')}
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#800000] mb-1">Branch</h3>
              <p className="text-xs text-[#800000] font-medium">
                {p.branch || 'Land and Water Resources Engineering'}
              </p>
            </div>
          </div>

          {/* DELETE CONFIRMATION POPUP MODAL */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center max-w-xs w-full shadow-2xl space-y-3">
                <div className="w-8 h-8 rounded-lg bg-[#F5B842] text-[#800000] font-bold flex items-center justify-center mx-auto text-sm">
                  🗑
                </div>
                <p className="text-[#800000] text-xs font-bold leading-snug">
                  Are you sure you want to permanently delete this paper?
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button 
                    onClick={handleConfirmDelete} 
                    className="px-6 py-1 bg-[#F5B842] text-[#800000] text-xs font-bold rounded-lg border border-[#d99e2b] cursor-pointer hover:opacity-90"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => setShowDeleteModal(false)} 
                    className="px-4 py-1 border border-gray-300 text-gray-600 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PaperDetailsPage;