import React, { useState } from 'react';
import { Search, Building, Sprout, GraduationCap, Award, CheckCircle2 } from 'lucide-react';
import Navbar from './Navbar';
import SiyasatLogo from './SiyasatLogo';

const HomePage = ({
  onLoginClick,
  onGoToPortal,
  onNavigate,
  currentUser,
  onLogout,
  onUploadSubmit,
  thesesList = [],
  onSelectPaper
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdviser = currentUser?.role === 'ADVISER';
  const isElevatedUser = isAdmin || isAdviser;

  const [uploadData, setUploadData] = useState({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    branch: '',
    keywords: '',
    abstract: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Fallback papers matching high fidelity design cards
  const defaultFallbackPapers = [
    {
      id: 1,
      department: 'Branch A',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...',
    },
    {
      id: 2,
      department: 'Branch A',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...',
    },
    {
      id: 3,
      department: 'Branch A',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...',
    },
    {
      id: 4,
      department: 'Branch A',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...',
    }
  ];

  const displayPapers = (Array.isArray(thesesList) && thesesList.length > 0)
    ? thesesList.slice(0, 4)
    : defaultFallbackPapers;

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [similarityScore, setSimilarityScore] = useState(0);

  const handleFormUpload = async (e, forceUpload = false) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setDuplicateWarning(null);

    const token = localStorage.getItem('siyasat_token');

    if (token) {
      const formDataToSend = new FormData();
      formDataToSend.append('title', uploadData.title);
      formDataToSend.append('author', uploadData.author);
      formDataToSend.append('year', uploadData.year);
      formDataToSend.append('department', uploadData.branch || 'AB Land and Water Resources Engineering');
      formDataToSend.append('keywords', uploadData.keywords);
      formDataToSend.append('abstract', uploadData.abstract);
      if (file) formDataToSend.append('file', file);
      if (forceUpload) formDataToSend.append('ignoreDuplicate', 'true');

      try {
        const res = await fetch('http://localhost:5000/api/theses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formDataToSend
        });
        const data = await res.json();

        if (res.status === 409) {
          setDuplicateWarning(data.message);
          setSimilarityScore(data.similarityScore || 0);
        } else if (res.ok) {
          setShowSuccessPopup(true);
          setUploadData({
            title: '',
            author: '',
            year: new Date().getFullYear(),
            branch: '',
            keywords: '',
            abstract: ''
          });
          setFile(null);
        } else {
          alert(data.message || 'Upload failed.');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred during upload.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        if (onUploadSubmit) {
          await onUploadSubmit(uploadData, file);
        }
        setShowSuccessPopup(true);
        setUploadData({
          title: '',
          author: '',
          year: new Date().getFullYear(),
          branch: '',
          keywords: '',
          abstract: ''
        });
        setFile(null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] siyasat-contour-lines font-sans text-gray-800 antialiased selection:bg-[#800000] selection:text-white">
      
      {/* ------------------ HERO BANNER SECTION ------------------ */}
      <section className="relative bg-[#800000] text-white pt-4 pb-24 px-6 md:px-12 overflow-hidden rounded-b-[40px]">
        
        {/* NAVBAR OVERLAY */}
        <Navbar 
          activePage="home" 
          onNavigate={onNavigate} 
          currentUser={currentUser} 
          onLoginClick={onLoginClick} 
        />

        {/* HERO CONTENT */}
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6 pt-6 pb-12">
          
          {/* BRAND LOGO BADGE */}
          <div className="flex justify-center mb-4">
            <div className="border-4 border-white/90 px-8 py-3 rounded-2xl backdrop-blur-xs shadow-lg inline-flex items-center justify-center">
              <SiyasatLogo variant="white" size="xl" />
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            A Research and Thesis Repository with AI Gap Analysis Tool
          </h1>

          <p className="text-base md:text-lg font-semibold text-[#F5B842] tracking-wide">
            CLSU Department of Agricultural and Biosystems Engineering
          </p>

          <div className="pt-4">
            {!currentUser && (
              <button
                onClick={onLoginClick}
                className="px-12 py-3 bg-[#660000] hover:bg-[#4d0000] border border-white/30 text-white font-bold text-sm rounded-full shadow-lg cursor-pointer transition-all"
              >
                Log In
              </button>
            )}
          </div>
        </div>

      </section>

      {/* ------------------ PILLARS SECTION ------------------ */}
      <section id="about" className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-1">
          <p className="text-xs font-extrabold tracking-wider text-[#800000] uppercase">The Department of</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#800000] font-serif">Agricultural and Biosystems Engineering</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white/90 border border-gray-200/80 rounded-3xl p-6 text-center shadow-xs flex flex-col items-center hover:shadow-md transition-all">
            <Building className="w-10 h-10 text-[#800000] mb-4 stroke-[1.5]" />
            <h3 className="text-base font-bold text-[#800000] mb-2 font-serif">Foundation</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              The Department of Agricultural and Biosystems Engineering (ABE) is one of four departments under CLSU's College of Engineering.
            </p>
          </div>

          <div className="bg-white/90 border border-gray-200/80 rounded-3xl p-6 text-center shadow-xs flex flex-col items-center hover:shadow-md transition-all">
            <Sprout className="w-10 h-10 text-[#F5B842] mb-4 stroke-[1.5]" />
            <h3 className="text-base font-bold text-[#800000] mb-2 font-serif">Mission</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              The department trains engineers to apply engineering science and design to the sustainable production, processing, and handling of agricultural materials.
            </p>
          </div>

          <div className="bg-white/90 border border-gray-200/80 rounded-3xl p-6 text-center shadow-xs flex flex-col items-center hover:shadow-md transition-all">
            <GraduationCap className="w-10 h-10 text-[#800000] mb-4 stroke-[1.5]" />
            <h3 className="text-base font-bold text-[#800000] mb-2 font-serif">Curriculum</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Formerly the Department of Agricultural Engineering, it now offers the BSABE program covering soil and water engineering, farm power, and agricultural processing.
            </p>
          </div>

          <div className="bg-white/90 border border-gray-200/80 rounded-3xl p-6 text-center shadow-xs flex flex-col items-center hover:shadow-md transition-all">
            <Award className="w-10 h-10 text-[#F5B842] mb-4 stroke-[1.5]" />
            <h3 className="text-base font-bold text-[#800000] mb-2 font-serif">Legacy</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              With roots in CLSU's earliest days as an agricultural school, the department has grown into a respected center for agricultural engineering education and research in Central Luzon.
            </p>
          </div>

        </div>
      </section>

      {/* ------------------ REPOSITORY PREVIEW SECTION ------------------ */}
      <section id="repository" className="bg-[#800000] text-white py-16 px-6 md:px-12 rounded-[40px] max-w-7xl mx-auto my-8">
        <div className="max-w-6xl mx-auto relative z-10 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold font-serif tracking-tight">Research and Thesis Repository</h2>
            <div className="relative max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Search some keywords..."
                className="w-full bg-[#660000] text-white placeholder-white/60 border border-white/20 rounded-full py-2.5 pl-10 pr-6 text-xs focus:outline-none focus:border-white/50"
              />
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
            </div>
          </div>

          {/* PAPER CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
            {displayPapers.map((p, idx) => (
              <div
                key={p.id || p._id || idx}
                onClick={() => {
                  if (onSelectPaper) onSelectPaper(p);
                  onNavigate('paper-details');
                }}
                className="bg-[#660000]/60 border border-white/20 rounded-2xl p-5 flex flex-col justify-between hover:bg-[#660000] cursor-pointer transition-all shadow-md"
              >
                <div>
                  <span className="inline-block bg-white/15 text-white/90 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                    {p.department || p.branch || 'Branch A'}
                  </span>
                  <h4 className="text-xs font-bold leading-snug mb-2 line-clamp-3">
                    {p.title}
                  </h4>
                  <p className="text-[10px] text-white/70 italic mb-3">
                    by {p.author || p.authors}
                  </p>
                  <p className="text-[11px] text-white/80 leading-relaxed line-clamp-3">
                    {p.abstract}
                  </p>
                </div>
                <div className="pt-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPaper) onSelectPaper(p);
                      onNavigate('paper-details');
                    }}
                    className="px-4 py-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold rounded-full border border-white/30 cursor-pointer transition-all"
                  >
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => onNavigate('repository')}
              className="px-8 py-2 bg-[#660000] hover:bg-[#4d0000] text-white text-xs font-bold rounded-full border border-white/30 cursor-pointer transition-all shadow-sm"
            >
              Load Papers
            </button>
          </div>

        </div>
      </section>

      {/* ------------------ UPLOAD SECTION (FOR ADMIN & ADVISER) ------------------ */}
      {isElevatedUser && (
        <section id="upload-section" className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="bg-[#FAF8F5]/90 backdrop-blur-sm border border-gray-200/90 rounded-3xl p-8 md:p-12 shadow-xs relative">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#800000] text-center font-serif mb-8">
              Upload Your Paper
            </h2>

            <form onSubmit={handleFormUpload} className="space-y-6">
              
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  id="home-title" 
                  value={uploadData.title} 
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })} 
                  placeholder=" " 
                  className="peer w-full px-4 py-3 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent" 
                />
                <label htmlFor="home-title" className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">Title</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    id="home-author" 
                    value={uploadData.author} 
                    onChange={(e) => setUploadData({ ...uploadData, author: e.target.value })} 
                    placeholder=" " 
                    className="peer w-full px-4 py-3 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent" 
                  />
                  <label htmlFor="home-author" className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">Author</label>
                </div>

                <div className="relative">
                  <input 
                    type="number" 
                    required 
                    id="home-year" 
                    value={uploadData.year} 
                    onChange={(e) => setUploadData({ ...uploadData, year: e.target.value })} 
                    placeholder=" " 
                    className="peer w-full px-4 py-3 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent" 
                  />
                  <label htmlFor="home-year" className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">Year Accepted</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <input 
                    type="text" 
                    id="home-branch" 
                    value={uploadData.branch} 
                    onChange={(e) => setUploadData({ ...uploadData, branch: e.target.value })} 
                    placeholder=" " 
                    className="peer w-full px-4 py-3 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent" 
                  />
                  <label htmlFor="home-branch" className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">Branch</label>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    id="home-keywords" 
                    value={uploadData.keywords} 
                    onChange={(e) => setUploadData({ ...uploadData, keywords: e.target.value })} 
                    placeholder=" " 
                    className="peer w-full px-4 py-3 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-semibold bg-transparent" 
                  />
                  <label htmlFor="home-keywords" className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">Keywords</label>
                </div>
              </div>

              <div className="relative">
                <textarea
                  required
                  rows={7}
                  id="home-abstract"
                  value={uploadData.abstract}
                  onChange={(e) => setUploadData({ ...uploadData, abstract: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 py-3 rounded-xl border border-gray-400/80 text-gray-900 focus:outline-none focus:border-[#800000] text-xs font-medium bg-transparent resize-none"
                />
                <label htmlFor="home-abstract" className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">Abstract</label>

                {showSuccessPopup && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-300 flex flex-col items-center justify-center p-6 text-center shadow-lg z-20 space-y-3 animate-in fade-in">
                    <CheckCircle2 className="w-9 h-9 text-[#800000]" />
                    <p className="text-[#800000] text-xs md:text-sm font-extrabold">
                      You have successfully uploaded your paper!
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSuccessPopup(false)}
                      className="px-8 py-1.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-bold text-xs rounded-full border border-[#d99e2b] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="w-full px-4 py-3 rounded-xl border border-gray-400/80 flex items-center justify-between bg-transparent">
                  <span className="text-xs font-semibold text-gray-700">
                    {file ? file.name : 'No file chosen'}
                  </span>
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg border border-gray-300 transition-all text-xs font-bold text-[#800000]">
                    Browse
                    <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>
                <label className="absolute left-3 -top-2.5 bg-[#FAF8F5] px-2 text-xs font-bold text-[#800000]">File Upload</label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full py-3.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-extrabold text-sm rounded-xl border border-[#d99e2b] shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>

            {/* DUPLICATE WARNING MODAL */}
            {duplicateWarning && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex items-center justify-center p-4 z-40">
                <div className="bg-white rounded-2xl border border-amber-300 p-6 text-center max-w-sm w-full shadow-2xl space-y-4">
                  <h3 className="text-sm font-bold text-[#800000]">Possible Duplicate Detected!</h3>
                  {similarityScore > 0 && (
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-left space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-gray-700">Similarity Match</span>
                        <span className="text-[#800000] font-extrabold">{similarityScore}% Match</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-700 leading-relaxed">{duplicateWarning}</p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => handleFormUpload(null, true)}
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
        </section>
      )}

      {/* ------------------ FOOTER ------------------ */}
      <footer className="bg-[#FAF8F5] text-gray-700 pt-16 pb-12 px-6 md:px-12 border-t border-gray-200/60 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-[#800000] mb-3 font-serif">Title</h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm">
              CLSU Department of Agricultural and Biosystems Engineering Thesis Repository.
            </p>
          </div>

          <div className="md:text-center">
            <h3 className="text-lg font-bold text-[#800000] mb-3 font-serif">Links</h3>
            <ul className="text-xs text-gray-600 space-y-1.5 font-medium">
              <li onClick={() => onNavigate('home')} className="hover:text-[#800000] cursor-pointer">• Home</li>
              <li onClick={() => onNavigate('repository')} className="hover:text-[#800000] cursor-pointer">• Repository</li>
              <li onClick={() => onNavigate('about')} className="hover:text-[#800000] cursor-pointer">• About Us</li>
            </ul>
          </div>

          <div className="md:text-right">
            <h3 className="text-lg font-bold text-[#800000] mb-3 font-serif">Contact Us</h3>
            <ul className="text-xs text-gray-600 space-y-1.5 font-medium">
              <li>• Central Luzon State University</li>
              <li>• Science City of Muñoz, Nueva Ecija</li>
            </ul>
          </div>
        </div>

        <div className="text-center relative z-10 pt-4">
          <h1 className="text-[13vw] font-black text-[#800000]/15 tracking-widest font-serif select-none leading-none">
            SIYASAT
          </h1>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;