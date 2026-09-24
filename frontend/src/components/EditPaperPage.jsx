import React, { useState, useEffect } from 'react';

const EditPaperPage = ({ onNavigate, currentUser, paper, onSaveEdit }) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdviser = currentUser?.role === 'ADVISER';
  const isElevatedUser = isAdmin || isAdviser;

  // Safe Universal ID Resolver Helper
  const getPaperId = (p) => {
    if (!p) return null;
    if (p.id !== undefined && p.id !== null) return p.id;
    if (p.thesis_id !== undefined && p.thesis_id !== null) return p.thesis_id;
    if (p._id !== undefined && p._id !== null) return p._id;
    return null;
  };

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    branch: 'Land and Water Resources Engineering',
    keywords: '',
    abstract: ''
  });

  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (paper) {
      setFormData({
        title: paper.title || '',
        author: paper.author || paper.authors || '',
        year: paper.dateAccepted || paper.year || new Date().getFullYear(),
        department: paper.department || paper.branch || 'Land and Water Resources Engineering',
        keywords: Array.isArray(paper.keywords) ? paper.keywords.join(', ') : (paper.keywords || ''),
        abstract: paper.abstract || ''
      });
    }
  }, [paper]);

  // Prevent white screen crash if paper is null upon mount
  if (!paper) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-[#800000]">
        <p className="text-sm font-bold mb-4">No paper selected for editing.</p>
        <button
          onClick={() => onNavigate && onNavigate('repository')}
          className="px-6 py-2 bg-[#F5B842] text-[#800000] font-bold text-xs rounded-full shadow-xs cursor-pointer"
        >
          Return to Repository
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const paperId = getPaperId(paper);
    if (!paperId) {
      alert('Error: Missing paper ID. Please re-select the paper from the repository.');
      return;
    }

    setIsSubmitting(true);

    const token = localStorage.getItem('siyasat_token');
    const updateData = new FormData();
    updateData.append('title', formData.title || '');
    updateData.append('author', formData.author || '');
    updateData.append('year', formData.year || '');
    updateData.append('department', formData.department || '');
    updateData.append('keywords', formData.keywords || '');
    updateData.append('abstract', formData.abstract || '');

    if (file) {
      updateData.append('file', file);
    }

    try {
      const res = await fetch(`https://siyasat-backend.onrender.com/api/theses/${paperId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: updateData
      });

      if (res.ok) {
        if (onSaveEdit) await onSaveEdit();
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          if (onNavigate) onNavigate('repository');
        }, 1500);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('Server error response:', errJson);
        alert(`Failed to save edits: ${errJson.message || 'Database update failed'}`);
      }
    } catch (err) {
      console.error('Edit error:', err.response?.data || err);
      alert('Network error connecting to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#800000] font-sans relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-16">
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #800000 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div onClick={() => onNavigate && onNavigate('home')} className="flex items-center space-x-2 cursor-pointer">
          <span className="text-3xl font-black tracking-wider uppercase font-serif text-[#800000]">SIYASAT</span>
        </div>

        <div className="flex items-center space-x-1 bg-[#EFECE6]/80 backdrop-blur-md rounded-full px-4 py-1.5 border border-gray-200 shadow-xs text-xs font-semibold text-gray-700">
          <button onClick={() => onNavigate && onNavigate('home')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Home</button>
          <button onClick={() => onNavigate && onNavigate('repository')} className="px-5 py-1.5 rounded-full bg-[#F5B842] text-[#800000] font-bold shadow-xs cursor-pointer">Repository</button>
          {isElevatedUser && (
            <button onClick={() => onNavigate && onNavigate('upload')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Upload</button>
          )}
          {isAdmin && (
            <button onClick={() => onNavigate && onNavigate('users')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Accounts</button>
          )}
          <button onClick={() => onNavigate && onNavigate('about')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">About Us</button>
        </div>

        <div>
          {currentUser ? (
            <button onClick={() => onNavigate && onNavigate('profile')} className="w-10 h-10 rounded-full bg-[#F5B842] text-white font-bold text-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-90">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
            </button>
          ) : (
            <button onClick={() => onNavigate && onNavigate('login')} className="px-5 py-1.5 bg-[#800000] text-white rounded-full text-xs font-bold cursor-pointer hover:bg-[#660000]">
              Log In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-4 relative z-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#800000] text-center tracking-tight mb-8">
          Edit Your Paper
        </h1>

        <div className="bg-[#EFECE6]/40 border border-gray-200/80 rounded-3xl p-8 md:p-10 shadow-2xs relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                required
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#800000]/60 text-[#800000] placeholder-[#800000]/70 focus:outline-none text-xs font-semibold bg-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#800000]/60 text-[#800000] placeholder-[#800000]/70 focus:outline-none text-xs font-semibold bg-transparent"
              />
              <input
                type="number"
                required
                placeholder="Year Accepted"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#800000]/60 text-[#800000] placeholder-[#800000]/70 focus:outline-none text-xs font-semibold bg-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#800000]/60 text-[#800000] focus:outline-none text-xs font-semibold bg-transparent"
              >
                <option value="Land and Water Resources Engineering">Land and Water Resources Engineering</option>
                <option value="Farm Power and Machinery Engineering">Farm Power and Machinery Engineering</option>
                <option value="Agricultural Structures and Environmental Control Engineering">Agricultural Structures and Environmental Control Engineering</option>
                <option value="Agricultural and Biosystems Processing Engineering (Post-Harvest)">Agricultural and Biosystems Processing Engineering (Post-Harvest)</option>
                <option value="Agricultural Informatics and Automation">Agricultural Informatics and Automation</option>
              </select>

              <input
                type="text"
                placeholder="Keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#800000]/60 text-[#800000] placeholder-[#800000]/70 focus:outline-none text-xs font-semibold bg-transparent"
              />
            </div>

            <div>
              <textarea
                required
                rows={8}
                placeholder="Abstract"
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#800000]/60 text-[#800000] placeholder-[#800000]/70 focus:outline-none text-xs font-semibold bg-transparent resize-none"
              />
            </div>

            <div className="relative flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#800000]/60 bg-transparent text-[#800000]">
              <span className="text-xs font-semibold text-[#800000]/80">
                {file ? file.name : (paper?.file_path || paper?.filePath ? 'PDF Attached (Click icon to replace)' : 'Attach PDF File (Max 25MB)')}
              </span>
              <label className="cursor-pointer">
                <svg className="w-4 h-4 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-extrabold text-sm rounded-lg border border-[#d99e2b] shadow-2xs cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Edits'}
            </button>
          </form>

          {showSuccessModal && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-3xl flex items-center justify-center p-4 z-30">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-sm w-full shadow-2xl space-y-5">
                <p className="text-[#800000] text-sm font-bold leading-relaxed">
                  You have successfully edited your paper!
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    if (onNavigate) onNavigate('repository');
                  }}
                  className="px-10 py-1.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-bold text-xs rounded-lg border border-[#d99e2b] shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EditPaperPage;