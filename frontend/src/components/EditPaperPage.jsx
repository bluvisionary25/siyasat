import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, CheckCircle2, ChevronDown } from 'lucide-react';
import Navbar from './Navbar';

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
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

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
    setStatusMsg({ type: '', text: '' });

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
        setStatusMsg({ type: 'success', text: 'Cloud update successful!' });
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          if (onNavigate) onNavigate('repository');
        }, 1500);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('Server error response:', errJson);
        setStatusMsg({ type: 'error', text: `Failed to save edits: ${errJson.message || 'Database update failed'}` });
      }
    } catch (err) {
      console.error('Edit error:', err.response?.data || err);
      setStatusMsg({ type: 'error', text: 'Network error connecting to backend server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] siyasat-contour-lines text-[#800000]  relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-20">
      
      {/* NAVBAR */}
      <Navbar 
        activePage="repository" 
        onNavigate={onNavigate} 
        currentUser={currentUser} 
      />

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-6 pt-4 relative z-10 space-y-8">
        
        {/* PAGE TITLE */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#800000] text-center tracking-tight ">
          Edit Your Paper
        </h1>

        {/* FORM CONTAINER BOX */}
        <div className="bg-[#FAF8F5]/90 backdrop-blur-sm border border-gray-200/90 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-visible">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* TITLE FIELD */}
            <div className="relative">
              <input
                type="text"
                required
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder=" "
                className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent"
              />
              <label 
                htmlFor="edit-title" 
                className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all"
              >
                Title
              </label>
            </div>

            {/* AUTHOR & YEAR ACCEPTED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <input
                  type="text"
                  required
                  id="edit-author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent"
                />
                <label 
                  htmlFor="edit-author" 
                  className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all"
                >
                  Author
                </label>
              </div>

              <div className="relative">
                <input
                  type="number"
                  required
                  id="edit-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent"
                />
                <label 
                  htmlFor="edit-year" 
                  className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all"
                >
                  Year Accepted
                </label>
              </div>
            </div>

            {/* BRANCH & KEYWORDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <select
                  id="edit-branch"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent appearance-none cursor-pointer"
                >
                  <option value="Land and Water Resources Engineering">Land and Water Resources Engineering</option>
                  <option value="Farm Power and Machinery Engineering">Farm Power and Machinery Engineering</option>
                  <option value="Agricultural Structures and Environmental Control Engineering">Agricultural Structures and Environmental Control Engineering</option>
                  <option value="Agricultural and Biosystems Processing Engineering (Post-Harvest)">Agricultural and Biosystems Processing Engineering (Post-Harvest)</option>
                  <option value="Agricultural Informatics and Automation">Agricultural Informatics and Automation</option>
                </select>
                <label 
                  htmlFor="edit-branch" 
                  className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all pointer-events-none"
                >
                  Department
                </label>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  id="edit-keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent"
                />
                <label 
                  htmlFor="edit-keywords" 
                  className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all"
                >
                  Keywords
                </label>
              </div>
            </div>

            {/* ABSTRACT TEXTAREA */}
            <div className="relative">
              <textarea
                required
                rows={8}
                id="edit-abstract"
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                placeholder=" "
                className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-medium bg-transparent resize-none leading-relaxed"
              />
              <label 
                htmlFor="edit-abstract" 
                className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all"
              >
                Abstract
              </label>

              {/* SUCCESS POPUP OVERLAY INSIDE ABSTRACT / FORM */}
              {showSuccessModal && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-300 flex flex-col items-center justify-center p-6 text-center shadow-lg z-30 space-y-4 animate-in fade-in">
                  <CheckCircle2 className="w-10 h-10 text-[#800000]" />
                  <p className="text-[#800000] text-sm md:text-base font-extrabold tracking-tight">
                    You have successfully edited your paper!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      if (onNavigate) onNavigate('repository');
                    }}
                    className="px-10 py-2 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-extrabold text-xs rounded-full border border-[#d99e2b] shadow-xs cursor-pointer transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* FILE UPLOAD FIELD */}
            <div className="relative">
              <div className="w-full px-4 py-3.5 rounded-xl border border-gray-400/80 flex items-center justify-between bg-transparent">
                <span className="text-xs font-semibold text-gray-700 truncate">
                  {file ? `Queued for replacement: ${file.name}` : (paper?.file_path || paper?.filePath ? 'PDF Attached (Click icon to replace)' : 'Attach PDF File (Max 25MB)')}
                </span>
                <label className="cursor-pointer flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg border border-gray-300 transition-all">
                  <UploadIcon className="w-3.5 h-3.5 text-[#800000]" />
                  <span className="text-xs font-bold text-[#800000]">Browse</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
              <label className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">
                File Upload
              </label>
            </div>

            {statusMsg.text && (
              <div className={`p-3 rounded-lg text-xs font-bold ${statusMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {statusMsg.text}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('repository')}
                disabled={isSubmitting}
                className="w-full sm:w-1/3 py-3.5 bg-transparent hover:bg-gray-100 text-gray-600 font-bold text-sm rounded-xl border border-gray-300 shadow-xs cursor-pointer transition-all disabled:opacity-50 flex justify-center items-center"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-2/3 py-3.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-extrabold text-sm rounded-xl border border-[#d99e2b] shadow-xs cursor-pointer transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#800000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Edits...
                  </>
                ) : 'Save Edits'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditPaperPage;
