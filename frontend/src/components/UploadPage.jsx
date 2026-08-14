import React, { useState } from 'react';
import { Upload as UploadIcon, AlertTriangle } from 'lucide-react';

const UploadPage = ({ onNavigate, currentUser, onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    branch: 'AB Land and Water Resources Engineering',
    keywords: '',
    abstract: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [similarityScore, setSimilarityScore] = useState(0);

  const handleSubmit = async (e, forceUpload = false) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setDuplicateWarning(null);

    const token = localStorage.getItem('siyasat_token');
    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('author', formData.author);
    uploadData.append('year', formData.year);
    uploadData.append('department', formData.branch);
    uploadData.append('keywords', formData.keywords);
    uploadData.append('abstract', formData.abstract);
    if (file) uploadData.append('file', file);
    if (forceUpload) uploadData.append('ignoreDuplicate', 'true');

    try {
      const res = await fetch('http://localhost:5000/api/theses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadData
      });

      const data = await res.json();

      if (res.status === 409) {
        // DUPLICATE DETECTED
        setDuplicateWarning(data.message);
        setSimilarityScore(data.similarityScore || 0);
      } else if (res.ok) {
        if (onUploadSuccess) onUploadSuccess();
        setShowSuccessModal(true);
      } else {
        alert(data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('An error occurred during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 50) return '#dc2626'; // Red
    if (score >= 30) return '#f97316'; // Orange
    return '#eab308'; // Yellow
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#800000] font-sans relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-16">
      {/* Background Radial Pattern */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #800000 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      {/* HEADER NAVBAR */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div onClick={() => onNavigate('home')} className="flex items-center space-x-2 cursor-pointer">
          <span className="text-3xl font-black tracking-wider uppercase font-serif text-[#800000]">SIYASAT</span>
        </div>

        <div className="flex items-center space-x-1 bg-[#EFECE6]/80 backdrop-blur-md rounded-full px-4 py-1.5 border border-gray-200 text-xs font-semibold text-gray-700">
          <button onClick={() => onNavigate('home')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Home</button>
          <button onClick={() => onNavigate('repository')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Repository</button>
          <button onClick={() => onNavigate('upload')} className="px-5 py-1.5 rounded-full bg-[#F5B842] text-[#800000] font-bold shadow-xs cursor-pointer">Upload</button>
          {currentUser?.role === 'ADMIN' && (
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

      {/* UPLOAD FORM CONTAINER */}
      <main className="max-w-5xl mx-auto px-6 pt-4 relative z-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#800000] text-center tracking-tight mb-8">
          Upload Thesis Data
        </h1>

        <div className="bg-[#EFECE6]/40 border border-gray-200/80 rounded-3xl p-8 md:p-10 shadow-2xs relative">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
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
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#800000]/60 text-[#800000] focus:outline-none text-xs font-semibold bg-transparent"
              >
                <option value="AB Machinery and Power Engineering">AB Machinery and Power Engineering</option>
                <option value="AB Land and Water Resources Engineering">AB Land and Water Resources Engineering</option>
                <option value="AB Structures and Environment Engineering">AB Structures and Environment Engineering</option>
                <option value="AB Process Engineering">AB Process Engineering</option>
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
                {file ? file.name : 'Attach PDF File (Max 25MB)'}
              </span>
              <label className="cursor-pointer">
                <UploadIcon className="w-4 h-4 text-[#800000]" />
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
              {isSubmitting ? 'Scanning & Uploading Document...' : 'Enter'}
            </button>
          </form>

          {/* DUPLICATE WARNING MODAL */}
          {duplicateWarning && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-3xl flex items-center justify-center p-4 z-40">
              <div className="bg-white rounded-2xl border border-amber-300 p-6 text-center max-w-sm w-full shadow-2xl space-y-4">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-[#800000]">Possible Duplicate Detected!</h3>

                {/* Visual Progress Meter */}
                {similarityScore > 0 && (
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-left space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-gray-600">Similarity Score</span>
                      <span style={{ color: getScoreColor(similarityScore) }}>{similarityScore}% Match</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${similarityScore}%`,
                          backgroundColor: getScoreColor(similarityScore)
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-700 leading-relaxed">
                  {duplicateWarning}
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleSubmit(null, true)}
                    className="px-5 py-1.5 bg-[#F5B842] text-[#800000] text-xs font-bold rounded-lg border border-[#d99e2b] cursor-pointer hover:opacity-90"
                  >
                    Proceed Anyway
                  </button>
                  <button
                    onClick={() => setDuplicateWarning(null)}
                    className="px-4 py-1.5 border border-gray-300 text-gray-600 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS MODAL POPUP */}
          {showSuccessModal && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs rounded-3xl flex items-center justify-center p-4 z-30">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-sm w-full shadow-2xl space-y-5">
                <p className="text-[#800000] text-sm font-bold leading-relaxed">
                  You have successfully uploaded the thesis paper!
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    onNavigate('repository');
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

export default UploadPage;