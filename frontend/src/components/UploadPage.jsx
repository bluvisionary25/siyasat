import React, { useState } from 'react';
import { Upload as UploadIcon, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import Navbar from './Navbar';

const UploadPage = ({ onNavigate, currentUser, onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    department: '',
    keywords: '',
    abstract: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const handleSubmit = async (e, forceUpload = false) => {
    if (e) e.preventDefault();
    setUploadError(null);
    setDuplicateWarning(null);

    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Invalid file type. Please upload a PDF document.');
      return;
    }

    setIsSubmitting(true);

    const token = localStorage.getItem('siyasat_token');
    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('author', formData.author);
    uploadData.append('year', formData.year);
    uploadData.append('department', formData.department || 'AB Land and Water Resources Engineering');
    uploadData.append('keywords', formData.keywords);
    uploadData.append('abstract', formData.abstract);
    if (file) uploadData.append('file', file);
    if (forceUpload) uploadData.append('ignoreDuplicate', 'true');

    try {
      const res = await fetch('https://siyasat-backend.onrender.com/api/theses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadData
      });

      const data = await res.json();

      if (res.status === 409) {
        setDuplicateWarning(data.message);
        setSimilarityScore(data.similarityScore || 0);
      } else if (res.ok) {
        if (onUploadSuccess) onUploadSuccess();
        setShowSuccessModal(true);
      } else {
        setUploadError(data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      setUploadError('An error occurred during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] siyasat-contour-lines text-[#800000]  relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-20">
      
      {/* NAVBAR */}
      <Navbar 
        activePage="upload" 
        onNavigate={onNavigate} 
        currentUser={currentUser} 
      />

      {/* UPLOAD FORM CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 pt-4 relative z-10 space-y-8">
        
        {/* PAGE TITLE */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#800000] text-center tracking-tight ">
          Upload Your Paper
        </h1>

        {uploadError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-sm font-bold text-center animate-in fade-in">
            {uploadError}
          </div>
        )}

        {/* FORM CONTAINER BOX */}
        <div className="bg-[#FAF8F5]/90 backdrop-blur-sm border border-gray-200/90 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-visible">
          
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            
            {/* TITLE FIELD */}
            <div className="relative">
              <input
                type="text"
                required
                id="upload-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder=" "
                className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent"
              />
              <label 
                htmlFor="upload-title" 
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
                  id="upload-author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent"
                />
                <label 
                  htmlFor="upload-author" 
                  className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all"
                >
                  Author
                </label>
              </div>

              <div className="relative">
                <input
                  type="number"
                  required
                  id="upload-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent"
                />
                <label 
                  htmlFor="upload-year" 
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
                  id="upload-branch"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent appearance-none cursor-pointer"
                >
                  <option value="" disabled hidden></option>
                  <option value="Land and Water Resources Engineering">Land and Water Resources Engineering</option>
                  <option value="Farm Power and Machinery Engineering">Farm Power and Machinery Engineering</option>
                  <option value="Agricultural Structures and Environmental Control Engineering">Agricultural Structures and Environmental Control Engineering</option>
                  <option value="Agricultural and Biosystems Processing Engineering (Post-Harvest)">Agricultural and Biosystems Processing Engineering (Post-Harvest)</option>
                  <option value="Agricultural Informatics and Automation">Agricultural Informatics and Automation</option>
                </select>
                <label 
                  htmlFor="upload-department" 
                  className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all pointer-events-none"
                >
                  Department
                </label>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  id="upload-keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent"
                />
                <label 
                  htmlFor="upload-keywords" 
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
                id="upload-abstract"
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                placeholder=" "
                className="peer w-full px-4 py-3.5 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-medium bg-transparent resize-none leading-relaxed"
              />
              <label 
                htmlFor="upload-abstract" 
                className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000] transition-all"
              >
                Abstract
              </label>

              {/* SUCCESS POPUP OVERLAY INSIDE ABSTRACT / FORM */}
              {showSuccessModal && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-300 flex flex-col items-center justify-center p-6 text-center shadow-lg z-30 space-y-4 animate-in fade-in">
                  <CheckCircle2 className="w-10 h-10 text-[#800000]" />
                  <p className="text-[#800000] text-sm md:text-base font-extrabold tracking-tight">
                    You have successfully uploaded your paper!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      onNavigate('repository');
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
                  {file ? file.name : 'No file chosen'}
                </span>
                <label className="cursor-pointer flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg border border-gray-300 transition-all">
                  <UploadIcon className="w-3.5 h-3.5 text-[#800000]" />
                  <span className="text-xs font-bold text-[#800000]">Browse</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      setFile(e.target.files[0]);
                      setUploadError(null);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <label className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">
                File Upload
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-black text-sm rounded-xl border border-[#d99e2b] shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading Document...' : 'Submit'}
            </button>

          </form>

          {/* DUPLICATE WARNING MODAL */}
          {duplicateWarning && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex items-center justify-center p-4 z-40">
              <div className="bg-white rounded-2xl border border-amber-300 p-6 text-center max-w-sm w-full shadow-2xl space-y-4">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-[#800000]">Possible Duplicate Detected!</h3>
                {similarityScore > 0 && (
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-left space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-gray-600">Similarity Score</span>
                      <span className="text-amber-600 font-extrabold">{similarityScore}% Match</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-700 leading-relaxed">{duplicateWarning}</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleSubmit(null, true)}
                    className="px-5 py-1.5 bg-[#F5B842] text-[#800000] text-xs font-bold rounded-full border border-[#d99e2b] cursor-pointer hover:opacity-90"
                  >
                    Proceed Anyway
                  </button>
                  <button
                    onClick={() => setDuplicateWarning(null)}
                    className="px-4 py-1.5 border border-gray-300 text-gray-600 text-xs font-bold rounded-full cursor-pointer hover:bg-gray-100"
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

export default UploadPage;
