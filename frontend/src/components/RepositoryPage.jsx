import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Trash2, Edit3, ChevronDown, Sparkles, Loader2, BookOpen } from 'lucide-react';
import Navbar from './Navbar';

const RepositoryPage = ({
  onNavigate,
  currentUser,
  thesesList = [],
  onSelectPaper,
  onDeletePaper,
  onLogout,
  onLoginClick,
  initialSearchQuery = ''
}) => {
  const userRole = currentUser?.role?.toUpperCase() || null;
  const isAdmin = userRole === 'ADMIN';
  const isAdviser = userRole === 'ADVISER';
  const isStudent = userRole === 'STUDENT';

  // PB015 & PB030 Rule: Allow public/unauthenticated, Student, and Adviser to use AI Gap Analysis
  const canUseAi = !isAdmin;
  const isElevatedUser = isAdmin || isAdviser;

  const getUrlSearchQuery = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || params.get('search') || params.get('keyword') || '';
      return decodeURIComponent(q).trim();
    } catch {
      return '';
    }
  };

  const [searchQuery, setSearchQuery] = useState(() => {
    const urlQ = getUrlSearchQuery();
    return initialSearchQuery ? String(initialSearchQuery).trim() : urlQ;
  });

  useEffect(() => {
    if (initialSearchQuery !== undefined && initialSearchQuery !== null) {
      setSearchQuery(String(initialSearchQuery).trim());
    }
  }, [initialSearchQuery]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    try {
      const trimmed = val.trim();
      const currentUrl = new URL(window.location.href);
      if (trimmed) {
        currentUrl.searchParams.set('search', trimmed);
      } else {
        currentUrl.searchParams.delete('search');
        currentUrl.searchParams.delete('q');
        currentUrl.searchParams.delete('keyword');
      }
      window.history.replaceState(null, '', currentUrl.toString());
    } catch (err) {
      console.warn('URL search sync failed:', err);
    }
  };

  const [selectedBranch, setSelectedBranch] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [openCardMenuId, setOpenCardMenuId] = useState(null);
  const [paperToDelete, setPaperToDelete] = useState(null);

  const [viewMode, setViewMode] = useState('list');
  const [openFolderId, setOpenFolderId] = useState(null);

  // AI Gap Analysis state
  const [selectedPaperForAi, setSelectedPaperForAi] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [openPaperAccordionId, setOpenPaperAccordionId] = useState(null);

  const [aiGaps, setAiGaps] = useState(null);



  const papersSource = thesesList;

  const filteredPapers = papersSource.filter(p => {
    const rawQ = searchQuery.trim().toLowerCase();
    const branchMatch = selectedBranch === 'All' || (p.department || p.branch || '').toLowerCase().includes(selectedBranch.toLowerCase());

    if (!rawQ) {
      return branchMatch;
    }

    const titleStr = (p.title || '').toLowerCase();
    const authorStr = (p.author || p.authors || '').toLowerCase();
    const abstractStr = (p.abstract || '').toLowerCase();
    const keywordsStr = (Array.isArray(p.keywords) ? p.keywords.join(' ') : (p.keywords || '')).toLowerCase();
    const branchStr = (p.department || p.branch || '').toLowerCase();

    // 1. Direct case-insensitive strict word boundary match against title, abstract, or keywords
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const combinedText = ` ${titleStr} ${abstractStr} ${keywordsStr} `;
    
    const tokens = rawQ.replace(/[,;|]/g, ' ').split(/\s+/).filter(t => t.length > 0);
    if (tokens.length > 0) {
      const allTokensMatch = tokens.every(token => {
        const regex = new RegExp(`\\b${escapeRegExp(token)}`, 'i');
        return regex.test(combinedText);
      });
      if (allTokensMatch) {
        return branchMatch;
      }
    }
    return false;
  });

  // Reorder papers cleanly without state mutation
  const sortPapers = (papers, sortKey) => {
    const list = [...papers];
    switch (sortKey) {
      case 'latest':
      case 'newest':
        return list.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return list.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        });
      case 'title':
      case 'title_asc':
        return list.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
      case 'title_desc':
        return list.sort((a, b) => (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' }));
      case 'similarity':
      case 'similarity_desc':
        return list.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
      default:
        return list;
    }
  };

  const sortedPapers = sortPapers(filteredPapers, sortBy);

  const clusteredFolders = {};
  if (viewMode === 'folders') {
    sortedPapers.forEach(paper => {
      const clusterName = paper.cluster_group || 'Independent Studies';
      if (!clusteredFolders[clusterName]) {
        clusteredFolders[clusterName] = [];
      }
      clusteredFolders[clusterName].push(paper);
    });
  }

  const sortedFolderKeys = Object.keys(clusteredFolders).sort((nameA, nameB) => {
    const papersA = clusteredFolders[nameA] || [];
    const papersB = clusteredFolders[nameB] || [];
    if (sortBy === 'similarity' || sortBy === 'similarity_desc') {
      const avgA = papersA.reduce((acc, p) => acc + (p.similarity_score || 0), 0) / (papersA.length || 1);
      const avgB = papersB.reduce((acc, p) => acc + (p.similarity_score || 0), 0) / (papersB.length || 1);
      return avgB - avgA;
    }
    if (sortBy === 'title' || sortBy === 'title_asc') {
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'title_desc') {
      return nameB.localeCompare(nameA);
    }
    return 0;
  });

  const handleAnalyzePaperGaps = async (paper) => {

    setSelectedPaperForAi(paper);
    setIsAnalyzing(true);
    setAiError(null);

    try {
      const res = await fetch('https://siyasat-backend.onrender.com/api/analyze-gaps', {
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
        onLoginClick={onLoginClick}
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

            <div className="flex bg-[#FAF8F5] border border-gray-300 rounded-full p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${viewMode === 'list' ? 'bg-[#800000] text-white shadow-sm' : 'text-[#800000] hover:bg-gray-100'
                  }`}
              >
                📄 All Papers
              </button>
              <button
                type="button"
                onClick={() => setViewMode('folders')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${viewMode === 'folders' ? 'bg-[#800000] text-white shadow-sm' : 'text-[#800000] hover:bg-gray-100'
                  }`}
              >
                📂 Auto-Clustered Folders
              </button>
            </div>

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
                <option value="latest">Date: Newest First</option>
                <option value="oldest">Date: Oldest First</option>
                <option value="title">Title: A-Z</option>
                <option value="title_desc">Title: Z-A</option>
                <option value="similarity">Similarity Score</option>
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-gray-300 text-gray-900 placeholder-[#800000]/60 rounded-full py-2.5 pl-10 pr-6 text-xs font-semibold focus:outline-none focus:border-[#800000]"
            />
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#800000]" />
          </div>
        </div>



        {/* 2-COLUMN REPOSITORY & AI GAP ANALYSIS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto pt-2">

          {/* LEFT COLUMN: THESIS PAPERS LIST */}
          <div className="lg:col-span-7 bg-[#FAF8F5]/90 border border-gray-200/90 rounded-3xl p-5 shadow-xs max-h-[750px] overflow-y-auto space-y-4">

            {/* EMPTY STATE - NO PAPERS IN REPOSITORY */}
            {sortedPapers.length === 0 && (
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

            {viewMode === 'list' ? (
              sortedPapers.map((paper, idx) => {
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
                    className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer relative group ${isSelectedForAi
                        ? 'border-[#F5B842] ring-2 ring-[#F5B842]/50 shadow-md'
                        : 'border-gray-200/80 hover:border-[#800000]/40 shadow-2xs'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-xs md:text-sm font-extrabold text-[#800000] leading-snug pr-4 group-hover:underline">
                        {paper.title}
                      </h3>
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
                              {isAdmin && (
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
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-[#800000]/80 mt-1 mb-2">
                      {authorsLine} | {yearVal} | <span className="text-gray-500 font-medium">Uploaded: {paper.created_at ? new Date(paper.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}</span>
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 font-medium mb-3">
                      {paper.abstract}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {currentUser?.role !== 'ADMIN' && (
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
              })
            ) : (
              // FOLDER VIEW MODE
              <div>
                <div className="mb-4 bg-blue-50/60 border border-blue-100 text-blue-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center shadow-sm">
                  ℹ️ Similarity evaluated across Title, Abstract, and Keywords.
                </div>
                {sortedFolderKeys.map((clusterName, idx) => {
                  const clusterPapers = clusteredFolders[clusterName] || [];
                  const avgSim = Math.round(clusterPapers.reduce((acc, p) => acc + (p.similarity_score || 0), 0) / clusterPapers.length);
                  const isOpen = openFolderId === clusterName;

                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                      <div
                        className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setOpenFolderId(isOpen ? null : clusterName)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📂</span>
                          <div>
                            <h3 className="text-sm font-extrabold text-[#800000]">{clusterName}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-[10px] font-bold bg-[#800000] text-white px-2 py-0.5 rounded-full">
                                {clusterPapers.length} Paper{clusterPapers.length !== 1 ? 's' : ''}
                              </span>
                              <span className="text-[10px] font-semibold text-gray-500">
                                Avg Similarity: {avgSim}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-[#800000] transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isOpen && (
                        <div className="p-4 bg-gray-50/50 space-y-4 border-t border-gray-100">
                          {clusterPapers.map((paper, pIdx) => {
                            const paperId = paper.id || paper._id || pIdx;
                            const authorsLine = paper.author || paper.authors || 'Unknown';
                            const yearVal = paper.year || 2020;
                            const isSelectedForAi = selectedPaperForAi && (selectedPaperForAi.id === paperId || selectedPaperForAi.title === paper.title);

                            // Badge Logic
                            const score = paper.similarity_score || 0;
                            let badgeColor = 'bg-gray-100 text-gray-700';
                            let badgeText = `${score}% Match - Low Similarity`;

                            if (score === 100 && !paper.matched_thesis_id) {
                              badgeColor = 'bg-yellow-100 text-yellow-800 border border-yellow-300';
                              badgeText = '⭐ Cluster Seed Paper';
                            } else if (score >= 75) {
                              badgeColor = 'bg-green-100 text-green-800 border border-green-300';
                              badgeText = `🟢 ${score}% Match - Direct Methodological Sibling`;
                            } else if (score >= 50) {
                              badgeColor = 'bg-blue-100 text-blue-800 border border-blue-300';
                              badgeText = `🔵 ${score}% Match - Same Research Folder`;
                            }

                            let matchedAgainstText = null;
                            if (paper.matched_thesis_id) {
                              const matchedParent = papersSource.find(p => p.id === paper.matched_thesis_id);
                              if (matchedParent) {
                                matchedAgainstText = `Matched against: ${matchedParent.title} (${score}% Overlap)`;
                              }
                            }

                            return (
                              <div
                                key={paperId}
                                onClick={() => {
                                  if (onSelectPaper) onSelectPaper(paper);
                                  onNavigate('paper-details', paper);
                                }}
                                className={`bg-white rounded-xl p-4 border transition-all cursor-pointer relative group ${isSelectedForAi
                                    ? 'border-[#F5B842] ring-2 ring-[#F5B842]/50 shadow-md'
                                    : 'border-gray-200/80 hover:border-[#800000]/40 shadow-xs'
                                  }`}
                              >
                                <div className="flex items-start justify-between">
                                  <h3 className="text-xs md:text-sm font-extrabold text-[#800000] leading-snug pr-4 group-hover:underline">
                                    {paper.title}
                                  </h3>
                                  <div className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold ${badgeColor} whitespace-nowrap`}>
                                    {badgeText}
                                  </div>
                                </div>
                                <p className="text-[11px] font-bold text-[#800000]/80 mt-1 mb-2">
                                  {authorsLine} | {yearVal} | <span className="text-gray-500 font-medium">Uploaded: {paper.created_at ? new Date(paper.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}</span>
                                </p>
                                <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2 font-medium mb-3">
                                  {paper.abstract}
                                </p>

                                {matchedAgainstText && (
                                  <div className="mb-3 text-[10px] text-[#800000] font-bold">
                                    🔗 {matchedAgainstText}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                  {currentUser?.role !== 'ADMIN' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAnalyzePaperGaps(paper);
                                      }}
                                      disabled={isAnalyzing}
                                      className="px-3 py-1 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-extrabold text-[10px] rounded-full flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-all disabled:opacity-50"
                                    >
                                      <Sparkles className="w-3 h-3 text-[#800000]" />
                                      <span>AI Analyze</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onSelectPaper) onSelectPaper(paper);
                                      onNavigate('paper-details', paper);
                                    }}
                                    className="text-[10px] font-bold text-[#800000] flex items-center space-x-1 hover:underline cursor-pointer"
                                  >
                                    <BookOpen className="w-3 h-3 text-[#800000]" />
                                    <span>Read</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

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
                {currentUser?.role === 'ADMIN'
                  ? 'AI Analysis is disabled for System Administrators.'
                  : (canUseAi
                    ? 'Click "AI Analyze Gaps" on any paper card to run AI analysis.'
                    : 'AI Gap Tool (Student & Adviser feature)')}
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

                {/* AI ADVISORY BANNER */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-lg my-4 flex items-start gap-3 shadow-xs">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <strong className="text-amber-900 font-semibold block text-sm">Academic AI Advisory:</strong>
                    <p className="text-amber-800 text-xs sm:text-sm font-medium leading-relaxed mt-1">This gap analysis is generated by AI and may contain inaccuracies. Findings should serve as preliminary exploration and must be independently verified against peer-reviewed literature and faculty guidance.</p>
                  </div>
                </div>

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