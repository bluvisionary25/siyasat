import React, { useState } from 'react';
import { Search, MoreVertical, Trash2, Edit3, ChevronDown, Sparkles, Loader2, BookOpen } from 'lucide-react';
import Navbar from './Navbar';

const RepositoryPage = ({ onNavigate, currentUser, thesesList = [], onSelectPaper, onDeletePaper }) => {
  const userRole = currentUser?.role?.toUpperCase() || 'STUDENT';
  const isAdmin = userRole === 'ADMIN';
  const isAdviser = userRole === 'ADVISER';
  const isStudent = userRole === 'STUDENT';
  
  // PB015 & PB030 Rule: ONLY Student and Adviser can use AI Gap Analysis
  const canUseAi = isStudent || isAdviser;
  const isElevatedUser = isAdmin || isAdviser;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [openCardMenuId, setOpenCardMenuId] = useState(null);
  const [paperToDelete, setPaperToDelete] = useState(null);

  // AI Gap Analysis state
  const [selectedPaperForAi, setSelectedPaperForAi] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [openPaperAccordionId, setOpenPaperAccordionId] = useState(null);

  const [aiGaps, setAiGaps] = useState(null);

  // Global AI Gap Analysis state
  const [isGlobalAnalyzing, setIsGlobalAnalyzing] = useState(false);
  const [globalAiResult, setGlobalAiResult] = useState(null);
  const [globalAiError, setGlobalAiError] = useState(null);
  const [openAccordionId, setOpenAccordionId] = useState(null);

  const handleGlobalAnalysis = async () => {
    if (!canUseAi) {
      alert('AI Gap Analysis is reserved exclusively for Students and Advisers.');
      return;
    }
    
    setIsGlobalAnalyzing(true);
    setGlobalAiError(null);
    setGlobalAiResult(null);
    
    try {
      const res = await fetch('http://localhost:5000/api/analyze-global-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setGlobalAiResult(data.result);
      } else {
        setGlobalAiError(data.message || 'AI could not generate global gaps. Please try again.');
      }
    } catch (err) {
      console.error('Global AI Analysis Error:', err);
      setGlobalAiError('Could not connect to AI service. Please check your connection.');
    } finally {
      setIsGlobalAnalyzing(false);
    }
  };

  const papersSource = thesesList;

  const filteredPapers = papersSource.filter(p => {
    const q = searchQuery.toLowerCase();
    const titleMatch = (p.title || '').toLowerCase().includes(q);
    const authorMatch = (p.author || p.authors || '').toLowerCase().includes(q);
    const abstractMatch = (p.abstract || '').toLowerCase().includes(q);
    const branchMatch = selectedBranch === 'All' || (p.department || p.branch || '').includes(selectedBranch);

    return (titleMatch || authorMatch || abstractMatch) && branchMatch;
  });

  const handleAnalyzePaperGaps = async (paper) => {
    if (!canUseAi) {
      alert('AI Gap Analysis is reserved exclusively for Students and Advisers.');
      return;
    }

    setSelectedPaperForAi(paper);
    setIsAnalyzing(true);
    setAiError(null);

    try {
      const res = await fetch('http://localhost:5000/api/analyze-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract,
          department: paper.department || paper.branch,
          keywords: paper.keywords
        })
      });

      const data = await res.json();
      if (res.ok && data.gaps && Array.isArray(data.gaps) && data.gaps.length > 0) {
        setAiGaps(data.gaps);
      } else {
        setAiError('AI could not generate gaps for this paper. Please try again.');
        setAiGaps(null);
      }
    } catch (err) {
      console.error('AI Analysis Error:', err);
      setAiError('Could not connect to AI service. Please check your connection.');
      setAiGaps(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (paperToDelete && onDeletePaper) {
      onDeletePaper(paperToDelete);
    }
    setPaperToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] siyasat-contour-lines text-[#800000] font-sans relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-20">
      
      {/* NAVBAR */}
      <Navbar 
        activePage="repository" 
        onNavigate={onNavigate} 
        currentUser={currentUser} 
      />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 pt-2 relative z-10 space-y-6">
        
        {/* PAGE TITLE */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#800000] text-center tracking-tight font-serif">
          Research and Thesis Repository
        </h1>

        {/* SEARCH AND FILTERS BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-6xl mx-auto pt-2">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            {/* CATEGORY FILTER PILL */}
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="appearance-none bg-[#FAF8F5] border border-gray-300 text-[#800000] font-bold text-xs rounded-full px-6 py-2.5 pr-8 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="All">Category</option>
                <option value="Machinery">Machinery & Power</option>
                <option value="Land">Land & Water</option>
                <option value="Structures">Structures & Environment</option>
                <option value="Processing">Process Engineering</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#800000] absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            {/* SORT BY PILL */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-[#FAF8F5] border border-gray-300 text-[#800000] font-bold text-xs rounded-full px-6 py-2.5 pr-8 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="latest">Sort by</option>
                <option value="latest">Newest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#800000] absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* SEARCH INPUT BAR */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search some keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-gray-300 text-gray-900 placeholder-[#800000]/60 rounded-full py-2.5 pl-10 pr-6 text-xs font-semibold focus:outline-none focus:border-[#800000]"
            />
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#800000]" />
          </div>
        </div>

        {/* GLOBAL AI GAP ANALYSIS SECTION */}
        {canUseAi && (
          <div className="max-w-6xl mx-auto pt-4 flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-[#FAF8F5]/90 border border-[#F5B842]/50 rounded-2xl p-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#800000] flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#F5B842]" />
                  <span>Global Repository Analysis</span>
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  Identify overarching research gaps across the latest theses in the repository.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGlobalAnalysis}
                disabled={isGlobalAnalyzing}
                className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white font-bold text-xs rounded-full flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50 shrink-0"
              >
                {isGlobalAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#F5B842]" />
                    <span>Analyze Repository Research Gaps</span>
                  </>
                )}
              </button>
            </div>
            
            {/* DISCLAIMER BANNER */}
            {(globalAiResult || isGlobalAnalyzing || globalAiError) && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg shadow-sm">
                <p className="text-xs text-amber-800 font-medium">
                  <span className="font-bold">Notice:</span> AI-generated research gaps are synthesized strictly from internal repository abstracts. Outputs may contain inaccuracies and should not serve as the sole justification for thesis proposals.
                </p>
              </div>
            )}

            {/* GLOBAL RESULTS OR LOADING OR ERROR */}
            {isGlobalAnalyzing && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200/60 shadow-sm text-center space-y-3">
                 <Loader2 className="w-8 h-8 text-[#F5B842] animate-spin mx-auto" />
                 <p className="text-xs font-bold text-[#800000]">Synthesizing repository-wide gaps...</p>
                 <p className="text-[11px] text-gray-500">Cross-referencing abstracts and extracting missing methodologies...</p>
              </div>
            )}

            {globalAiError && (
              <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm text-center">
                <p className="text-xs font-bold text-red-600">{globalAiError}</p>
              </div>
            )}

            {globalAiResult && !isGlobalAnalyzing && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-extrabold text-[#800000]">
                    Identified Research Gaps
                  </h3>
                  <span className="text-[10px] font-bold bg-[#FAF8F5] text-[#800000] px-3 py-1 rounded-full border border-gray-200">
                    Analyzed {globalAiResult.analyzed_count} papers
                  </span>
                </div>
                <p className="text-xs text-gray-700 italic border-l-2 border-[#F5B842] pl-3 py-1">
                  {globalAiResult.domain_summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {globalAiResult.gaps.map((gap, index) => (
                    <div key={index} className="bg-[#FAF8F5] rounded-xl p-4 border border-gray-200/60 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                           <div className="w-5 h-5 rounded-full bg-[#800000] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                             {index + 1}
                           </div>
                           <h4 className="text-xs font-extrabold text-[#800000] leading-snug">{gap.gap_title}</h4>
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium leading-relaxed pl-7">
                          {gap.description}
                        </p>
                      </div>

                      <div className="mt-4 pl-7">
                        <button
                          onClick={() => setOpenAccordionId(openAccordionId === index ? null : index)}
                          className="flex items-center space-x-1 text-[10px] font-bold text-[#800000] hover:text-[#F5B842] transition-colors cursor-pointer"
                        >
                          <span>View Cited Sources ({gap.supporting_papers?.length || 0} Papers)</span>
                          <ChevronDown className={`w-3 h-3 transform transition-transform ${openAccordionId === index ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {openAccordionId === index && (
                          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2">
                            {gap.supporting_papers?.map((sp, spIdx) => {
                              const citedPaper = papersSource.find(p => p.id === sp.id || (p.title && p.title.toLowerCase() === (sp.title || '').toLowerCase()));
                              return (
                                <div key={spIdx} className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                                  <div className="flex items-start justify-between">
                                    <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">ID: {sp.id}</span>
                                    <span className="text-[9px] font-bold text-gray-500">{sp.year}</span>
                                  </div>
                                  <p 
                                    className={`text-[10px] font-bold mt-1 leading-snug ${citedPaper ? 'text-[#800000] hover:underline cursor-pointer' : 'text-gray-800'}`}
                                    onClick={() => {
                                      if (citedPaper) {
                                        if (onSelectPaper) onSelectPaper(citedPaper);
                                        onNavigate('paper-details', citedPaper);
                                      }
                                    }}
                                  >
                                    {sp.title}
                                  </p>
                                  <p className="text-[9px] text-gray-500 italic mt-1">{sp.note}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2-COLUMN REPOSITORY & AI GAP ANALYSIS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto pt-2">
          
          {/* LEFT COLUMN: THESIS PAPERS LIST */}
          <div className="lg:col-span-7 bg-[#FAF8F5]/90 border border-gray-200/90 rounded-3xl p-5 shadow-xs max-h-[750px] overflow-y-auto space-y-4">
            
            {/* EMPTY STATE - NO PAPERS IN REPOSITORY */}
            {filteredPapers.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <BookOpen className="w-10 h-10 text-[#800000]/20" />
                <p className="text-sm font-extrabold text-[#800000]/40">
                  {searchQuery || selectedBranch !== 'All' ? 'No papers match your search.' : 'No papers in the repository yet.'}
                </p>
                <p className="text-xs text-gray-400 font-medium">
                  {searchQuery || selectedBranch !== 'All' ? 'Try adjusting your filters.' : 'Upload a thesis to get started.'}
                </p>
              </div>
            )}
            
            {filteredPapers.map((paper, idx) => {
              const paperId = paper.id || paper._id || idx;
              const authorsLine = paper.author || paper.authors || 'Dela Cruz, A., Downie, H., & Japson, A.';
              const yearVal = paper.year || 2020;
              const isSelectedForAi = selectedPaperForAi && (selectedPaperForAi.id === paperId || selectedPaperForAi.title === paper.title);

              return (
                <div
                  key={paperId}
                  onClick={() => {
                    if (onSelectPaper) onSelectPaper(paper);
                    onNavigate('paper-details', paper);
                  }}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer relative group ${
                    isSelectedForAi 
                      ? 'border-[#F5B842] ring-2 ring-[#F5B842]/50 shadow-md' 
                      : 'border-gray-200/80 hover:border-[#800000]/40 shadow-2xs'
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between">
                    <h3 className="text-xs md:text-sm font-extrabold text-[#800000] leading-snug pr-4 group-hover:underline">
                      {paper.title}
                    </h3>

                    {/* ADMIN / ADVISER OPTIONS MENU (3 DOTS) */}
                    {isElevatedUser && (
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenCardMenuId(openCardMenuId === paperId ? null : paperId)}
                          className="p-1 text-gray-400 hover:text-[#800000] rounded-full hover:bg-gray-100 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openCardMenuId === paperId && (
                          <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl p-1.5 shadow-xl w-32 z-30 text-xs font-semibold space-y-1 animate-in fade-in">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenCardMenuId(null);
                                if (onSelectPaper) onSelectPaper(paper);
                                onNavigate('edit-paper', paper);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-amber-50 text-gray-700 hover:text-[#800000] flex items-center space-x-2 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#800000]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenCardMenuId(null);
                                setPaperToDelete(paper);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-50 text-red-600 flex items-center space-x-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AUTHOR | YEAR */}
                  <p className="text-[11px] font-bold text-[#800000]/80 mt-1 mb-2">
                    {authorsLine} | {yearVal}
                  </p>

                  {/* ABSTRACT SNIPPET */}
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 font-medium mb-3">
                    {paper.abstract}
                  </p>

                  {/* CARD ACTION FOOTER */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {canUseAi ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyzePaperGaps(paper);
                        }}
                        disabled={isAnalyzing}
                        className="px-4 py-1.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-extrabold text-xs rounded-full flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
                      >
                        {isAnalyzing && selectedPaperForAi?.title === paper.title ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 text-[#800000] animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#800000]" />
                            <span>AI Analyze Gaps</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-400 italic">
                        (AI Gap Analysis for Students & Advisers)
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectPaper) onSelectPaper(paper);
                        onNavigate('paper-details', paper);
                      }}
                      className="text-[11px] font-bold text-[#800000] hover:underline flex items-center space-x-1"
                    >
                      <BookOpen className="w-3 h-3 text-[#800000]" />
                      <span>Read Paper</span>
                    </button>
                  </div>

                </div>
              );
            })}

          </div>

          {/* RIGHT COLUMN: ANALYZE GAPS PANEL */}
          <div className="lg:col-span-5 bg-[#FAF8F5]/90 border border-gray-200/90 rounded-3xl p-5 shadow-xs max-h-[750px] overflow-y-auto space-y-4">
            
            {/* PANEL HEADER PILL */}
            <div className="bg-[#E8E2D9] text-[#800000] font-extrabold text-xs text-center py-2.5 rounded-full shadow-2xs font-serif tracking-wide flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#800000]" />
              <span>Analyze Gaps</span>
            </div>

            {/* SELECTED PAPER SUBTITLE */}
            {selectedPaperForAi ? (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs">
                <span className="text-[10px] font-extrabold uppercase text-[#800000] block mb-0.5">Analyzing Paper:</span>
                <p className="font-bold text-gray-900 line-clamp-2 leading-snug">
                  {selectedPaperForAi.title}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic text-center">
                {canUseAi 
                  ? 'Click "AI Analyze Gaps" on any paper card to run AI analysis.' 
                  : 'AI Gap Tool (Student & Adviser feature)'}
              </p>
            )}

            {/* LOADING STATE */}
            {isAnalyzing ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#F5B842] animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#800000]">
                  AI is identifying research gaps for this thesis...
                </p>
                <p className="text-[11px] text-gray-500">
                  Scanning abstract, methodologies, and literature parameters...
                </p>
              </div>
            ) : aiGaps && aiGaps.length > 0 ? (
              /* GAP ITEMS LIST */
              <div className="space-y-4 pt-1">
                {aiGaps.map((gap, index) => (
                  <div key={gap.id || index} className="flex flex-col bg-white p-4 rounded-2xl border border-gray-200/60 shadow-2xs">
                    
                    <div className="flex items-start space-x-3.5">
                      {/* NUMBERED MAROON CIRCLE BADGE */}
                      <div className="w-6 h-6 rounded-full bg-[#800000] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        {index + 1}
                      </div>

                      {/* GAP CONTENT */}
                      <div className="space-y-1 w-full">
                        <h4 className="text-xs font-extrabold text-[#800000] leading-snug">
                          {gap.title}
                        </h4>
                        <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                          {gap.desc || gap.description}
                        </p>
                      </div>
                    </div>

                    {/* EXPANDABLE ACCORDION FOR CITATIONS */}
                    {((gap.cited_papers && gap.cited_papers.length > 0) || (gap.online_references && gap.online_references.length > 0)) && (
                      <div className="mt-3 pl-9 border-t border-gray-100 pt-3">
                        <button
                          onClick={() => setOpenPaperAccordionId(openPaperAccordionId === index ? null : index)}
                          className="flex items-center space-x-1 text-[10px] font-bold text-[#800000] hover:text-[#F5B842] transition-colors cursor-pointer"
                        >
                          <span>View Cited References ({(gap.cited_papers?.length || 0) + (gap.online_references?.length || 0)})</span>
                          <ChevronDown className={`w-3 h-3 transform transition-transform ${openPaperAccordionId === index ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {openPaperAccordionId === index && (
                          <div className="mt-3 space-y-4 max-h-60 overflow-y-auto pr-2">
                            {/* Section A: Internal Repository Context */}
                            {gap.cited_papers && gap.cited_papers.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">
                                  🏛️ Department Repository Footprint
                                </h5>
                                {gap.cited_papers.map((sp, spIdx) => {
                                  const citedPaper = papersSource.find(p => p.id === sp.id || (p.title && p.title.toLowerCase() === (sp.title || '').toLowerCase()));
                                  return (
                                    <div key={spIdx} className="bg-[#FAF8F5] p-2.5 rounded-lg border border-gray-200/60 shadow-sm">
                                      <div className="flex items-start justify-between">
                                        <span className="text-[9px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded uppercase">ID: {sp.id || 'N/A'}</span>
                                        {sp.year && <span className="text-[9px] font-bold text-gray-500">{sp.year}</span>}
                                      </div>
                                      <p 
                                        className={`text-[10px] font-bold mt-1 leading-snug ${citedPaper ? 'text-[#800000] hover:underline cursor-pointer' : 'text-gray-800'}`}
                                        onClick={() => {
                                          if (citedPaper) {
                                            if (onSelectPaper) onSelectPaper(citedPaper);
                                            onNavigate('paper-details', citedPaper);
                                          }
                                        }}
                                      >
                                        {sp.title}
                                      </p>
                                      <p className="text-[9px] text-gray-600 italic mt-1 border-l-2 border-[#F5B842] pl-2">{sp.note}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Section B: Global Published Literature (Peer-Reviewed) */}
                            {gap.online_references && gap.online_references.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">
                                  🌐 Global Published Literature (Peer-Reviewed DOIs)
                                </h5>
                                {gap.online_references.slice(0, 3).map((ref, refIdx) => (
                                  <div key={refIdx} className="bg-white p-2.5 rounded-lg border border-[#F5B842]/40 shadow-sm">
                                    <div className="flex items-start justify-between">
                                      <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex items-center">Verified Academic Publication</span>
                                      <span className="text-[9px] font-bold text-gray-500">{ref.year}</span>
                                    </div>
                                    <p className="text-[10px] font-bold mt-1 leading-snug text-gray-900">
                                      {ref.title}
                                    </p>
                                    <p className="text-[9px] text-gray-600 mt-1">
                                      {ref.authors} &mdash; <span className="italic">{ref.journal}</span>
                                    </p>
                                    {ref.doi_url && ref.doi_url.startsWith('http') && (
                                      <div className="mt-2">
                                        <a href={ref.doi_url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-blue-600 hover:underline">
                                          View Published Study / DOI ↗
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            ) : aiError ? (
              /* ERROR STATE */
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Sparkles className="w-8 h-8 text-[#800000]/20" />
                <p className="text-xs font-bold text-[#800000]/60">{aiError}</p>
              </div>
            ) : (
              /* IDLE STATE - WAITING FOR USER TO CLICK ANALYZE */
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <Sparkles className="w-10 h-10 text-[#800000]/20" />
                <p className="text-sm font-extrabold text-[#800000]/40">
                  No analysis yet
                </p>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  {canUseAi
                    ? 'Select a paper and click "AI Analyze Gaps" to identify research gaps.'
                    : 'AI Gap Analysis is available for Students & Advisers.'}
                </p>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* DELETE CONFIRMATION MODAL FOR ADMIN */}
      {paperToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center max-w-sm w-full shadow-2xl space-y-4">
            <Trash2 className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="text-sm font-extrabold text-[#800000]">Confirm Thesis Deletion</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Are you sure you want to permanently delete <span className="font-bold text-gray-900">"{paperToDelete.title}"</span>?
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-xs"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setPaperToDelete(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-full cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RepositoryPage;