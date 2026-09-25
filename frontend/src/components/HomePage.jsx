import React, { useState } from 'react';
import { Search, Building2, Sprout, GraduationCap, Award, Upload, CheckCircle2, ChevronDown } from 'lucide-react';
import Navbar from './Navbar';
import AuthModal from './AuthModal';
import SiyasatLogo from './SiyasatLogo';
import bgLight from '../assets/bg-light.png';

/**
 * UploadForm Component
 * Conditionally rendered for ADVISER or ADMIN roles
 */
const UploadForm = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    branch: '',
    keywords: '',
    abstract: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      if (onUploadSuccess) onUploadSuccess(formData, file);
      setFormData({
        title: '',
        author: '',
        year: new Date().getFullYear(),
        branch: '',
        keywords: '',
        abstract: ''
      });
      setFile(null);
    }, 600);
  };

  return (
    <section id="upload-section" className="w-full py-20 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto relative z-10">
      <div className="w-full bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-3xl p-6 sm:p-8 md:p-12 shadow-lg relative mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#7A0C0E] text-center  tracking-tight mb-8">
          Upload Your Paper
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              required
              id="upload-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder=" "
              className="peer w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#7A0C0E] focus:ring-1 focus:ring-[#7A0C0E] text-xs font-semibold bg-white"
            />
            <label
              htmlFor="upload-title"
              className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#7A0C0E] rounded transition-all"
            >
              Title
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <input
                type="text"
                required
                id="upload-author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder=" "
                className="peer w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#7A0C0E] focus:ring-1 focus:ring-[#7A0C0E] text-xs font-semibold bg-white"
              />
              <label
                htmlFor="upload-author"
                className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#7A0C0E] rounded transition-all"
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
                className="peer w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#7A0C0E] focus:ring-1 focus:ring-[#7A0C0E] text-xs font-semibold bg-white"
              />
              <label
                htmlFor="upload-year"
                className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#7A0C0E] rounded transition-all"
              >
                Year Accepted
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <select
                id="upload-branch"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="peer w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#7A0C0E] focus:ring-1 focus:ring-[#7A0C0E] text-xs font-semibold bg-white appearance-none cursor-pointer"
              >
                <option value="" disabled hidden></option>
                <option value="Land and Water Resources Engineering">Land and Water Resources Engineering</option>
                <option value="Farm Power and Machinery Engineering">Farm Power and Machinery Engineering</option>
                <option value="Agricultural Structures and Environmental Control Engineering">Agricultural Structures and Environmental Control Engineering</option>
                <option value="Agricultural and Biosystems Processing Engineering (Post-Harvest)">Agricultural and Biosystems Processing Engineering (Post-Harvest)</option>
                <option value="Agricultural Informatics and Automation">Agricultural Informatics and Automation</option>
              </select>
              <label
                htmlFor="upload-branch"
                className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#7A0C0E] rounded transition-all pointer-events-none"
              >
                Branch
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
                className="peer w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#7A0C0E] focus:ring-1 focus:ring-[#7A0C0E] text-xs font-semibold bg-white"
              />
              <label
                htmlFor="upload-keywords"
                className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#7A0C0E] rounded transition-all"
              >
                Keywords
              </label>
            </div>
          </div>

          <div className="relative">
            <textarea
              required
              rows={6}
              id="upload-abstract"
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              placeholder=" "
              className="peer w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-[#7A0C0E] focus:ring-1 focus:ring-[#7A0C0E] text-xs font-medium bg-white resize-none"
            />
            <label
              htmlFor="upload-abstract"
              className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#7A0C0E] rounded transition-all"
            >
              Abstract
            </label>
          </div>

          <div className="relative">
            <div className="w-full px-4 py-3.5 rounded-xl border border-gray-300 flex items-center justify-between bg-white">
              <span className="text-xs font-medium text-gray-600 truncate max-w-[240px] sm:max-w-md">
                {file ? file.name : 'No file chosen'}
              </span>
              <label className="cursor-pointer bg-[#FDFBF7] hover:bg-gray-100 px-3.5 py-1.5 rounded-lg border border-gray-300 transition-all text-xs font-bold text-[#7A0C0E] flex items-center gap-1.5 shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                Browse
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
            <label className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#7A0C0E] rounded transition-all">
              File Upload
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#E59819] hover:bg-[#d98b0f] text-[#7A0C0E] font-extrabold text-sm rounded-xl border border-[#d98b0f] shadow-sm cursor-pointer transition-all hover:shadow-md disabled:opacity-50 tracking-wide"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        {showSuccessModal && (
          <div className="absolute inset-0 bg-white/98 backdrop-blur-md rounded-3xl border border-gray-200 flex flex-col items-center justify-center p-6 text-center shadow-xl z-20 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#7A0C0E]" />
            <p className="text-[#7A0C0E] text-base font-extrabold tracking-tight">
              You have successfully uploaded your paper!
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="px-8 py-2.5 bg-[#E59819] hover:bg-[#d98b0f] text-[#7A0C0E] font-bold text-xs rounded-full border border-[#d98b0f] cursor-pointer transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

/**
 * HomePage Component
 * Main landing page matching the high-fidelity Figma specifications
 */
const HomePage = ({
  userRole: propUserRole,
  currentUser = null,
  onNavigate,
  onLoginClick,
  onOpenAuth,
  onLoginSuccess,
  onLogout,
  thesesList = [],
  onSelectPaper,
  onUploadSubmit
}) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Normalize role - strict unauthenticated guest default
  const effectiveRole = (propUserRole || currentUser?.role || '').toUpperCase();
  const isElevated = effectiveRole === 'ADVISER' || effectiveRole === 'ADMIN';
  const showLoginBtn = !effectiveRole;

  const handleOpenAuth = () => {
    if (onLoginClick) {
      onLoginClick();
    } else if (onOpenAuth) {
      onOpenAuth();
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleAuthClose = () => {
    setIsAuthOpen(false);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchKeyword.trim();
    try {
      if (trimmed) {
        window.history.pushState(null, '', `?search=${encodeURIComponent(trimmed)}`);
      }
    } catch (err) {
      console.warn('History pushState error:', err);
    }
    if (onNavigate) {
      onNavigate('repository', { searchQuery: trimmed });
    }
  };

  // 4 Department Pillars (Foundation, Mission, Curriculum, Legacy)
  const infoCards = [
    {
      title: 'Foundation',
      icon: Building2,
      description:
        "The Department of Agricultural and Biosystems Engineering (ABE) is one of four departments under CLSU's College of Engineering, offering the BSABE program in Science City of Muñoz, Nueva Ecija."
    },
    {
      title: 'Mission',
      icon: Sprout,
      description:
        'The department trains engineers to apply engineering science and design to the sustainable production, processing, and handling of food and agricultural materials.'
    },
    {
      title: 'Curriculum',
      icon: GraduationCap,
      description:
        'Formerly the Department of Agricultural Engineering, it now offers the BSABE program covering soil and water engineering, farm power, and agricultural processing.'
    },
    {
      title: 'Legacy',
      icon: Award,
      description:
        "With roots in CLSU's earliest days as an agricultural school, the department has grown into a respected center for agricultural engineering education and research in Central Luzon."
    }
  ];

  // Default fallback research papers
  const defaultPapers = [
    {
      id: 1,
      department: 'Branch A',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...'
    },
    {
      id: 2,
      department: 'Branch A',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...'
    },
    {
      id: 3,
      department: 'Branch A',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...'
    },
    {
      id: 4,
      department: 'Branch A',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...'
    }
  ];

  const allTheses = (Array.isArray(thesesList) && thesesList.length > 0) ? thesesList : defaultPapers;
  
  let filteredTheses = allTheses;
  const rawQ = searchKeyword.trim().toLowerCase();
  if (rawQ) {
    filteredTheses = allTheses.filter(p => {
      const titleStr = (p.title || '').toLowerCase();
      const abstractStr = (p.abstract || '').toLowerCase();
      const keywordsStr = (Array.isArray(p.keywords) ? p.keywords.join(' ') : (p.keywords || '')).toLowerCase();

      const directMatch =
        titleStr.includes(rawQ) ||
        abstractStr.includes(rawQ) ||
        keywordsStr.includes(rawQ);

      if (directMatch) return true;

      const tokens = rawQ.replace(/[,;|]/g, ' ').split(/\s+/).filter(t => t.length > 0);
      if (tokens.length > 0) {
        const combinedText = `${titleStr} ${abstractStr} ${keywordsStr}`;
        return tokens.every(token => combinedText.includes(token));
      }
      return false;
    });
  }

  const displayedTheses = filteredTheses.slice(0, 4);

  return (
    <div
      className="min-h-screen  text-gray-800 antialiased selection:bg-[#7A0C0E] selection:text-white relative overflow-x-hidden"
      style={{
        backgroundColor: '#FDFBF7',
        backgroundImage: `url(${bgLight})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* ------------------ 1. HERO BANNER SECTION ------------------ */}
      <section className="relative bg-[#7A0C0E] text-white pt-2 pb-16 overflow-hidden">
        {/* Subtle low-opacity gradient overlay (no heavy curved lines) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#62090b] via-[#7A0C0E] to-[#6c0b0d] opacity-95 pointer-events-none" />

        {/* TOP NAVBAR (Pure white logo and translucent pill navigation) */}
        <div className="relative z-20">
          <Navbar
            activePage="home"
            onNavigate={onNavigate}
            currentUser={currentUser}
            onLoginClick={handleOpenAuth}
            darkHeader={true}
          />
        </div>

        {/* HERO CONTENT */}
        <div className="w-full max-w-4xl mx-auto text-center relative z-10 px-4 sm:px-6 md:px-8 pt-4 pb-12 space-y-6">


          <div className="flex justify-center mb-2">
            <SiyasatLogo variant="white" size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-tight max-w-3xl mx-auto  drop-shadow-sm text-white">
            A Research and Thesis Repository with AI Gap Analysis Tool
          </h1>

          <p className="text-xs sm:text-sm md:text-base font-semibold text-[#E59819] tracking-wider uppercase ">
            CLSU Department of Agricultural and Biosystems Engineering
          </p>

          {/* CONDITIONAL LOGIN BUTTON: Render if STUDENT or logged out */}
          {showLoginBtn && (
            <div className="pt-3">
              <button
                type="button"
                onClick={handleOpenAuth}
                className="px-12 py-3 bg-[#5A080A] hover:bg-[#480507] border border-white/25 text-white font-bold text-sm rounded-full shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 tracking-wide"
              >
                Log In
              </button>
            </div>
          )}
        </div>

        {/* SMOOTH ASYMMETRIC ORGANIC BOTTOM WAVE (Sweeping cleanly into the white section) */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
          <svg
            className="relative block w-full h-14 sm:h-20 md:h-24 text-[#FDFBF7]"
            viewBox="0 0 1440 120"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,48 C360,112 840,112 1440,32 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ------------------ 2. DEPARTMENT PILLARS SECTION ------------------ */}
      <section id="about" className="w-full py-16 sm:py-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-1.5">
          <p className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-[#7A0C0E] uppercase ">
            THE DEPARTMENT OF
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#7A0C0E]  tracking-tight">
            Agricultural and Biosystems Engineering
          </h2>
        </div>

        {/* 4 Tall Balanced Cards with Gold Outlined Icons & Refined Typography */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {infoCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.title}
                className="w-full bg-white/95 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 sm:p-8 text-center shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center mx-auto"
              >
                {/* Outlined Gold Vector Icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-[#FAF4EA] border border-[#E59819]/20 shadow-xs">
                  <IconComponent className="w-8 h-8 text-[#E59819] stroke-[1.75]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#7A0C0E] mb-3  tracking-tight">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-normal">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------ 3. REPOSITORY SECTION WITH WAVE DIVIDERS ------------------ */}
      <div className="relative my-8">
        {/* Organic Asymmetric Top Wave entering Maroon Repository Section */}
        <div className="w-full overflow-hidden leading-none pointer-events-none -mb-1">
          <svg
            className="relative block w-full h-14 sm:h-20 md:h-24 text-[#7A0C0E]"
            viewBox="0 0 1440 120"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,96 C480,24 960,24 1440,80 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Full Viewport Maroon Body */}
        <section
          id="repository"
          className="w-full bg-[#7A0C0E] text-white py-14 px-4 sm:px-6 md:px-8 relative"
        >
          {/* Subtle dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#6e0b0d] via-[#7A0C0E] to-[#60080a] opacity-95 pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10 space-y-10">
            {/* Search Header */}
            <div className="text-center max-w-2xl mx-auto space-y-5">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold  tracking-tight">
                Research and Thesis Repository
              </h2>
              <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search some keywords..."
                  className="w-full bg-[#5E090B]/90 text-white placeholder-white/60 border border-white/20 rounded-full py-3 pl-11 pr-12 text-xs focus:outline-none focus:border-[#E59819] focus:ring-1 focus:ring-[#E59819] transition-all shadow-inner"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white cursor-pointer transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
              </form>
            </div>

            {/* 4 Featured Research Cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
              {displayedTheses.map((p, idx) => (
                <div
                  key={p.id || p._id || idx}
                  onClick={() => {
                    if (onSelectPaper) onSelectPaper(p);
                    if (onNavigate) onNavigate('paper-details');
                  }}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/15 cursor-pointer transition-all duration-300 shadow-md group hover:-translate-y-1 mx-auto"
                >
                  <div>
                    <span className="inline-block bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-3 tracking-wide">
                      {p.department || p.branch || 'Branch A'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold leading-snug mb-2 line-clamp-3 text-white group-hover:text-[#E59819] transition-colors ">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-white/75 italic mb-3 ">
                      by {p.author || p.authors}
                    </p>
                    <p className="text-[11px] text-white/80 leading-relaxed line-clamp-3  font-light">
                      {p.abstract}
                    </p>
                  </div>
                  <div className="pt-5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectPaper) onSelectPaper(p);
                        if (onNavigate) onNavigate('paper-details');
                      }}
                      className="px-4 py-1.5 bg-transparent hover:bg-white/20 text-white text-[11px] font-semibold rounded-full border border-white/40 cursor-pointer transition-all hover:border-white"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Centered Load Papers Button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('repository')}
                className="px-9 py-2.5 bg-[#5A080A] hover:bg-[#480507] text-white text-xs font-bold rounded-full border border-white/25 cursor-pointer transition-all shadow-md hover:scale-105 active:scale-95 tracking-wide"
              >
                Load Papers
              </button>
            </div>
          </div>
        </section>

        {/* Organic Asymmetric Bottom Wave exiting Maroon Repository Section */}
        <div className="w-full overflow-hidden leading-none pointer-events-none -mt-1">
          <svg
            className="relative block w-full h-14 sm:h-20 md:h-24 text-[#7A0C0E]"
            viewBox="0 0 1440 120"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 L1440,0 C1080,88 600,88 0,36 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* ------------------ 4. CONDITIONAL UPLOAD FORM (ADVISER & ADMIN ONLY) ------------------ */}
      {/* Upload Form removed from Home Page as per requirements. Users should use /upload route. */}

      {/* ------------------ 5. MULTI-COLUMN FOOTER WITH WATERMARK ------------------ */}
      <footer className="w-full relative overflow-hidden pt-20 pb-0 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-[#F7EBEB]/90 via-[#E4A5A5]/80 to-[#A73739]">
        {/* Content Container positioned safely above watermark */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10 sm:mb-16 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-[#7A0C0E] mb-1  tracking-tight">
              SIYASAT
            </h3>
            <p className="text-xs font-semibold text-[#7A0C0E]/90 mb-3">
              Department of Agricultural and Biosystems Engineering
            </p>
            <p className="text-xs sm:text-sm text-[#7A0C0E]/85 font-normal leading-relaxed max-w-sm ">
              Central Luzon State University's institutional repository for Agricultural and Biosystems Engineering research, facilitating automated thematic clustering and AI-powered literature gap exploration.
            </p>
          </div>

          <div className="md:text-center">
            <h3 className="text-xl font-bold text-[#7A0C0E] mb-3  tracking-tight">
              Quick Links
            </h3>
            <ul className="text-xs sm:text-sm text-[#7A0C0E]/85 space-y-1.5 font-normal  inline-block text-left">
              <li
                onClick={() => onNavigate && onNavigate('home')}
                className="hover:text-[#7A0C0E] hover:font-semibold cursor-pointer transition-all"
              >
                Home
              </li>
              <li
                onClick={() => onNavigate && onNavigate('repository')}
                className="hover:text-[#7A0C0E] hover:font-semibold cursor-pointer transition-all"
              >
                Repository
              </li>
              <li
                onClick={() => onNavigate && onNavigate('about')}
                className="hover:text-[#7A0C0E] hover:font-semibold cursor-pointer transition-all"
              >
                About Us
              </li>
              <li 
                onClick={() => currentUser ? (onNavigate && onNavigate('upload')) : setIsAuthOpen(true)}
                className="hover:text-[#7A0C0E] hover:font-semibold cursor-pointer transition-all"
              >
                Upload
              </li>
            </ul>
          </div>

          <div className="md:text-right">
            <h3 className="text-xl font-bold text-[#7A0C0E] mb-3  tracking-tight">
              Contact Us
            </h3>
            <ul className="text-xs sm:text-sm text-[#7A0C0E]/85 space-y-1.5 font-normal  inline-block text-left md:text-right">
              <li>
                <a href="mailto:bsabe@clsu.edu.ph" className="hover:text-[#7A0C0E] hover:font-semibold transition-all">bsabe@clsu.edu.ph</a>
              </li>
              <li>
                <a href="https://www.facebook.com/share/1CDrEGQ2d7/" target="_blank" rel="noopener noreferrer" className="hover:text-[#7A0C0E] hover:font-semibold transition-all">Facebook Page</a>
              </li>
              <li>CLSU, Science City of Muñoz, Nueva Ecija, Philippines</li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR / COPYRIGHT */}
        <div className="relative z-10 border-t border-[#7A0C0E]/20 py-4 text-center">
          <p className="text-xs text-[#7A0C0E]/70 font-medium">
            © 2026 Department of Agricultural and Biosystems Engineering, CLSU. All rights reserved.
          </p>
        </div>

        <div className="mt-10 w-full overflow-hidden">
          <h1 className="w-full text-center text-[18vw] font-black uppercase leading-none text-white/20 select-none pointer-events-none whitespace-nowrap translate-y-[20%]">
            SIYASAT
          </h1>
        </div>
      </footer>

      {/* ------------------ AUTH MODAL ------------------ */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={handleAuthClose}
        onLoginSuccess={(arg1, arg2) => {
          setIsAuthOpen(false);
          if (onLoginSuccess) {
            onLoginSuccess(arg1, arg2);
          } else {
            const token = typeof arg1 === 'string' ? arg1 : arg2;
            const user = typeof arg1 === 'object' ? arg1 : arg2;
            if (token) localStorage.setItem('siyasat_token', token);
            if (user) localStorage.setItem('siyasat_user', JSON.stringify(user));
            window.location.reload();
          }
          if (onNavigate) onNavigate('home');
        }}
        API_BASE={'https://siyasat-backend.onrender.com/api'}
      />
    </div>
  );
};

export default HomePage;
