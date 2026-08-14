import React, { useState } from 'react';

const RepositoryPage = ({ onNavigate, currentUser, thesesList = [], onSelectPaper, onDeletePaper }) => {
  // Role Checking
  const userRole = currentUser?.role?.toUpperCase() || 'STUDENT';
  const isAdmin = userRole === 'ADMIN';
  const isAdviser = userRole === 'ADVISER';
  const isStudent = userRole === 'STUDENT';

  // Per Backlog (PB015 & PB030): Only Student & Adviser can use AI Gap Analysis
  const canUseAi = isStudent || isAdviser;
  const canUpload = isAdmin || isAdviser;
  const isElevatedUser = isAdmin || isAdviser;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [openCardMenuId, setOpenCardMenuId] = useState(null);

  // Modals & AI State
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [selectedPaperForAi, setSelectedPaperForAi] = useState(null);
  const [aiGaps, setAiGaps] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);

  const branchesList = [
    'AB Machinery and Power Engineering',
    'AB Land and Water Resources Engineering',
    'AB Structures and Environment Engineering',
    'AB Process Engineering'
  ];

  const defaultGaps = [
    {
      id: 1,
      title: 'Limited performance data under variable weather conditions',
      desc: 'Many existing solar dryer studies test performance only under ideal, sunny conditions, with little data on efficiency during cloudy days, intermittent sunlight, or rainy seasons common in the Philippines.'
    },
    {
      id: 2,
      title: 'Lack of cost-benefit and adoption analysis for small-scale farmers',
      desc: 'Most studies focus on technical performance (drying rate, moisture reduction) but few evaluate the economic feasibility, payback period, or actual adoption barriers faced by small rice farmers.'
    },
    {
      id: 3,
      title: 'Minimal comparison with hybrid or backup heating systems',
      desc: 'Purely solar-powered dryers often underperform at night or during low-irradiance periods; there\'s limited research comparing straight solar designs against hybrid systems.'
    },
    {
      id: 4,
      title: 'Insufficient data on grain quality outcomes beyond moisture content',
      desc: 'Many studies measure drying efficiency and time but overlook how solar drying affects other quality indicators like milling recovery, grain breakage, or nutrient retention.'
    }
  ];

  const handleBranchToggle = (branch) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter(b => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  // Safe Universal ID Resolver Helper
  const getPaperId = (paper) => {
    if (!paper) return null;
    if (paper.id !== undefined && paper.id !== null) return paper.id;
    if (paper.thesis_id !== undefined && paper.thesis_id !== null) return paper.thesis_id;
    if (paper._id !== undefined && paper._id !== null) return paper._id;
    return null;
  };

  // Trigger AI Gap Analysis
  const handleRunAiAnalysis = async (paper) => {
    if (!paper) return;
    setIsAnalyzing(true);
    setAiError(null);

    try {
      const response = await fetch('http://localhost:5000/api/analyze-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract,
          department: paper.department || paper.branch,
          keywords: paper.keywords
        })
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.gaps)) {
        setAiGaps(data.gaps);
      } else {
        setAiError(data.message || 'Failed to retrieve AI gaps.');
      }
    } catch (err) {
      console.error('Error triggering AI Gap Analysis:', err);
      setAiError('Network error connecting to AI analysis service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (paperToDelete) {
      const targetId = getPaperId(paperToDelete);
      if (onDeletePaper && targetId !== null) {
        await onDeletePaper(targetId);
      }
      setPaperToDelete(null);
    }
  };

  const filteredTheses = (thesesList || []).filter((paper) => {
    if (!paper) return false;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      paper.title?.toLowerCase().includes(query) ||
      paper.author?.toLowerCase().includes(query) ||
      paper.abstract?.toLowerCase().includes(query);

    const paperDept = paper.department || paper.branch || '';
    const matchesBranch = selectedBranches.length === 0 || selectedBranches.includes(paperDept);

    const paperYear = parseInt(paper.year, 10);
    const matchesYearFrom = !yearFrom || (paperYear >= parseInt(yearFrom, 10));
    const matchesYearTo = !yearTo || (paperYear <= parseInt(yearTo, 10));

    return matchesSearch && matchesBranch && matchesYearFrom && matchesYearTo;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#800000] font-sans relative pb-12 overflow-x-hidden">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #800000 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* HEADER NAVIGATION */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-10">
        <div onClick={() => onNavigate('home')} className="flex items-center space-x-2 cursor-pointer">
          <span className="text-3xl font-black tracking-widest uppercase font-serif text-[#800000]">SIYASAT</span>
        </div>

        <div className="flex items-center space-x-1 bg-[#EFECE6]/80 backdrop-blur-md rounded-full px-4 py-1.5 border border-gray-200/80 shadow-2xs text-xs font-semibold text-[#800000]">
          <button onClick={() => onNavigate('home')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Home</button>
          <button onClick={() => onNavigate('repository')} className="px-5 py-1.5 rounded-full bg-[#F5B842] text-[#800000] font-bold shadow-xs cursor-pointer">Repository</button>

          {canUpload && (
            <button onClick={() => onNavigate('upload')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Upload</button>
          )}

          {isAdmin && (
            <button onClick={() => onNavigate('users')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Accounts</button>
          )}

          <button onClick={() => onNavigate('about')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">About Us</button>
        </div>

        <div>
          {currentUser ? (
            <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-[#F5B842] text-white font-bold text-lg flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </button>
          ) : (
            <button onClick={() => onNavigate('home')} className="px-5 py-1.5 bg-[#800000] text-white rounded-full text-xs font-bold cursor-pointer">
              Log In
            </button>
          )}
        </div>
      </header>

      {/* PAGE TITLE */}
      <div className="text-center mt-2 mb-6 relative z-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#800000] tracking-tight">
          Research and Thesis Repository
        </h1>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: PAPERS LIST */}
        <div className={canUseAi ? "lg:col-span-7 space-y-4" : "lg:col-span-12 space-y-4"}>
          <div className="relative z-20 space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCategoryPopup(!showCategoryPopup)}
                className="px-6 py-2 bg-[#EFECE6] border border-gray-300 rounded-full text-xs font-bold text-[#800000] hover:bg-[#e4e0d7] cursor-pointer shadow-2xs"
              >
                Category
              </button>

              <button className="px-6 py-2 bg-[#EFECE6] border border-gray-300 rounded-full text-xs font-bold text-[#800000] hover:bg-[#e4e0d7] cursor-pointer shadow-2xs">
                Sort by
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search some keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-300 bg-[#EFECE6]/60 text-xs text-[#800000] font-semibold focus:outline-none placeholder-[#800000]/60"
                />
                <svg className="w-4 h-4 text-[#800000]/70 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* CATEGORY OVERLAY POPUP */}
            {showCategoryPopup && (
              <div className="absolute top-11 left-0 z-50 bg-[#FDFBF7] border border-[#800000]/40 rounded-2xl p-4 w-72 shadow-xl space-y-4 text-xs font-semibold text-[#800000]">
                <fieldset className="border border-[#800000]/30 rounded-xl p-2.5">
                  <legend className="px-1 text-[11px] font-bold text-[#800000]">Year Approved</legend>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span>From</span>
                    <input
                      type="text"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                      className="w-16 px-2 py-0.5 border border-[#800000]/40 rounded-md bg-transparent focus:outline-none"
                    />
                    <span>To</span>
                    <input
                      type="text"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                      className="w-16 px-2 py-0.5 border border-[#800000]/40 rounded-md bg-transparent focus:outline-none"
                    />
                  </div>
                </fieldset>

                <fieldset className="border border-[#800000]/30 rounded-xl p-2.5 space-y-1.5">
                  <legend className="px-1 text-[11px] font-bold text-[#800000]">Branch</legend>
                  {branchesList.map((branch, idx) => (
                    <label key={idx} className="flex items-start space-x-2 cursor-pointer text-[10px] leading-tight">
                      <input
                        type="checkbox"
                        checked={selectedBranches.includes(branch)}
                        onChange={() => handleBranchToggle(branch)}
                        className="mt-0.5 rounded-xs accent-[#800000]"
                      />
                      <span>{branch}</span>
                    </label>
                  ))}
                </fieldset>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCategoryPopup(false)}
                    className="px-5 py-1 bg-[#F5B842] text-[#800000] font-bold text-xs rounded-full border border-[#d99e2b] shadow-xs cursor-pointer hover:opacity-90"
                  >
                    Set
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PAPERS LIST CONTAINER */}
          <div className="bg-[#EFECE6]/40 border border-gray-200/80 rounded-3xl p-4 max-h-[600px] overflow-y-auto space-y-4 pr-2">
            {filteredTheses.map((paper, index) => {
              const paperId = getPaperId(paper) || `paper-${index}`;
              const isAiSelected = selectedPaperForAi && getPaperId(selectedPaperForAi) === paperId;

              return (
                <div
                  key={paperId}
                  onClick={() => {
                    if (canUseAi) setSelectedPaperForAi(paper);
                    if (onSelectPaper) onSelectPaper(paper);
                  }}
                  className={`border rounded-2xl p-5 relative transition-all cursor-pointer ${isAiSelected && canUseAi
                      ? 'bg-[#EFECE6] border-[#800000] shadow-md ring-1 ring-[#800000]/30'
                      : 'bg-[#EFECE6]/60 border-gray-200/70 hover:shadow-xs'
                    }`}
                >
                  {/* 3-DOTS MENU TRIGGER (ADMIN & ADVISER) */}
                  {isElevatedUser && (
                    <div className="absolute top-4 right-4 z-30" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCardMenuId(openCardMenuId === paperId ? null : paperId);
                        }}
                        className="p-1.5 rounded-full hover:bg-black/10 text-[#800000] font-bold text-lg cursor-pointer transition-colors"
                      >
                        &#8226;&#8226;&#8226;
                      </button>

                      {openCardMenuId === paperId && (
                        <div
                          className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* EDIT BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCardMenuId(null);
                              // Pass paper as second arg so App.jsx sets selectedPaper
                              // before switching to the edit page (atomic state update)
                              if (onNavigate) onNavigate('edit-paper', paper);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-[#800000] font-semibold cursor-pointer"
                          >
                            Edit
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCardMenuId(null);
                              setPaperToDelete(paper);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <h3 className="text-sm md:text-base font-extrabold text-[#800000] leading-snug pr-8 mb-1">
                    {paper.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-[#800000]/80 mb-2">
                    {paper.author || paper.authors} | {paper.year}
                  </p>
                  <p className="text-xs text-gray-700/90 line-clamp-2 leading-relaxed">
                    {paper.abstract}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-300/40">
                    {canUseAi ? (
                      <span className="text-[10px] text-gray-500 font-medium">
                        {isAiSelected ? '✓ Selected for AI Analysis' : 'Click card to select for AI'}
                      </span>
                    ) : (
                      <span></span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectPaper) onSelectPaper(paper);
                        onNavigate('paper-details');
                      }}
                      className="text-xs font-bold text-[#800000] hover:underline cursor-pointer"
                    >
                      Read Full Thesis &rarr;
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTheses.length === 0 && (
              <div className="text-center py-12 text-xs font-semibold text-gray-500">
                No matching research papers found.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: AI GAP ANALYSIS PANEL (STUDENT & ADVISER ONLY) */}
        {canUseAi && (
          <div className="lg:col-span-5 bg-[#EFECE6]/40 border border-gray-200/80 rounded-3xl p-5 relative flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200/80 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#800000] tracking-tight">
                  AI Research Gap Analysis
                </h2>
                {selectedPaperForAi && (
                  <p className="text-[10px] text-gray-600 truncate max-w-[180px]">
                    Selected: <span className="font-semibold text-[#800000]">{selectedPaperForAi.title}</span>
                  </p>
                )}
              </div>

              {selectedPaperForAi && (
                <button
                  type="button"
                  onClick={() => handleRunAiAnalysis(selectedPaperForAi)}
                  disabled={isAnalyzing}
                  className="px-3.5 py-1.5 bg-[#800000] hover:bg-[#600000] text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Selected'}
                </button>
              )}
            </div>

            {/* Gaps Output List */}
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 flex-1">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                  <div className="w-8 h-8 border-3 border-[#800000] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-[#800000]">
                    Analyzing thesis abstract with AI...
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Identifying research gaps & future study directions
                  </p>
                </div>
              ) : aiError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center text-xs text-red-600 font-medium">
                  {aiError}
                </div>
              ) : (aiGaps.length > 0 ? aiGaps : defaultGaps).map((gap) => (
                <div key={gap.id} className="flex items-start space-x-3 text-xs bg-white/70 p-3.5 rounded-2xl border border-gray-200/60 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-[#800000] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {gap.id}
                  </span>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-[#800000] text-xs leading-snug">
                      {gap.title}
                    </h4>
                    <p className="text-[11px] text-gray-700 leading-relaxed font-normal">
                      {gap.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {paperToDelete && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl border border-gray-100 relative space-y-3">
            <div className="w-10 h-10 bg-[#F5B842]/20 rounded-xl flex items-center justify-center mx-auto text-[#F5B842]">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12z" />
              </svg>
            </div>

            <p className="text-[#800000] text-xs font-extrabold leading-snug px-2">
              Are you sure you want to permanently delete this paper?
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-8 py-1.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-extrabold text-xs rounded-full border border-[#d99e2b] shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPaperToDelete(null)}
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-base font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default RepositoryPage;