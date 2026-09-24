import React, { useState } from 'react';
import { Download, Edit3, Trash2, ArrowLeft, Sparkles, Loader2, X, ChevronDown, AlertTriangle } from 'lucide-react';
import Navbar from './Navbar';

const PaperDetailsPage = ({ paper, onNavigate, currentUser, onDeletePaper, onLoginClick }) => {
  const userRole = (currentUser?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isAdviser = userRole === 'ADVISER';
  const isStudent = userRole === 'STUDENT';
  const canUseAi = !isAdmin;
  const isElevatedUser = isAdmin || isAdviser;

  const [downloading, setDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // AI Gap Analysis State
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiGaps, setAiGaps] = useState([]);
  const [aiReferences, setAiReferences] = useState([]);
  const [aiError, setAiError] = useState(null);
  const [openPaperAccordionId, setOpenPaperAccordionId] = useState(null);

  const defaultPaper = {
    id: 1,
    title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
    authors: 'Dela Cruz, Juan A.\nDownie, Hailie Nichole\nJapson, Althea Myr',
    dateAccepted: 'July 31, 2026',
    branch: 'AB Land and Water Resources Engineering',
    abstract: `Postharvest losses in rice production remain a significant challenge in the Philippines, particularly due to inefficient and weather-dependent drying methods such as open sun drying. This study aimed to design, fabricate, and evaluate the performance of a solar-powered grain dryer intended for small- to medium-scale rice postharvest processing. The dryer was constructed using a solar collector, drying chamber, and auxiliary blower system to enhance airflow and heat distribution. Performance evaluation was conducted by measuring drying time, moisture reduction rate, drying efficiency, and grain quality parameters such as milling recovery and broken grain percentage, and comparing these against conventional sun-drying methods. Results showed that the solar-powered dryer significantly reduced drying time while maintaining higher grain quality and lower broken grain percentage compared to traditional sun drying. The study also assessed the system's cost-effectiveness and potential for adoption among small-scale farmers. Findings suggest that the developed solar dryer offers a viable, low-cost alternative for improving postharvest rice processing, reducing losses, and supporting sustainable agricultural practices in rural farming communities.`
  };

  const p = paper || defaultPaper;

  const handleRunAiAnalysis = async () => {
    if (isAdmin) {
      alert('AI Gap Analysis is disabled for System Administrators.');
      return;
    }

    setShowAiModal(true);
    setIsAnalyzing(true);
    setAiError(null);
    setAiGaps([]);
    setAiReferences([]);

    try {
      const res = await fetch('https://siyasat-backend.onrender.com/api/analyze-single-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id || p.thesis_id || p._id || -1,
          title: p.title,
          abstract: p.abstract,
          keywords: p.keywords
        })
      });

      const data = await res.json();
      if (res.ok && data.gaps && Array.isArray(data.gaps) && data.gaps.length > 0) {
        setAiGaps(data.gaps);
        setAiReferences(data.extracted_references || []);
      } else {
        setAiError(data.message || 'AI could not generate gaps for this paper.');
      }
    } catch (err) {
      console.error('AI Analysis Error:', err);
      setAiError('Could not connect to AI service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const targetId = p.id || p.thesis_id || p._id;
      let downloadUrl = targetId ? `https://siyasat-backend.onrender.com/api/theses/${targetId}/download` : null;
      let blob = null;

      if (downloadUrl) {
        const response = await fetch(downloadUrl);
        if (response.ok) {
          blob = await response.blob();
        }
      }

      if (!blob) {
        const genRes = await fetch('https://siyasat-backend.onrender.com/api/theses/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: p.title,
            author: p.authors || p.author,
            department: p.branch || p.department,
            year: p.year || 2026,
            abstract: p.abstract,
            keywords: p.keywords
          })
        });
        if (genRes.ok) {
          blob = await genRes.blob();
        }
      }

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanTitle = (p.title || 'Research_Paper')
          .replace(/[^a-zA-Z0-9\s-_]/g, '')
          .trim()
          .replace(/\s+/g, '_');
        a.download = `${cleanTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Could not download PDF. Please check server connection.');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Error downloading paper PDF.');
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 1200);
    }
  };

  const handleConfirmDelete = async () => {
    if (onDeletePaper) {
      await onDeletePaper(p.id);
    }
    setShowDeleteModal(false);
    onNavigate('repository');
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

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 pt-4 relative z-10 space-y-6">
        
        {/* BACK TO REPOSITORY BUTTON */}
        <button
          onClick={() => onNavigate('repository')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-[#800000] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Repository</span>
        </button>

        {/* PAPER DETAILS CARD CONTAINER */}
        <div className="bg-[#FAF8F5]/90 backdrop-blur-sm border border-gray-200/90 rounded-3xl p-8 md:p-10 shadow-xs space-y-6 relative overflow-visible">
          
          {/* TOP BAR WITH TITLE & ADMIN ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#800000] leading-snug font-serif">
              {p.title}
            </h1>

            {/* ADMIN / ADVISER ACTIONS */}
            {isElevatedUser && (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('edit-paper', p)}
                  className="px-4 py-1.5 bg-[#800000] hover:bg-[#660000] text-white font-bold text-xs rounded-full flex items-center space-x-1.5 cursor-pointer transition-all shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full flex items-center space-x-1.5 cursor-pointer transition-all shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* METADATA GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-y border-gray-200/80 py-4">
            <div>
              <p className="text-[10px] font-extrabold text-[#800000] uppercase tracking-wider">Authors</p>
              <p className="text-xs font-semibold text-gray-800 whitespace-pre-line mt-0.5">
                {p.authors || p.author}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#800000] uppercase tracking-wider">Year Accepted</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5">
                {p.dateAccepted || p.year || 2026}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#800000] uppercase tracking-wider">Branch / Department</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5">
                {p.branch || p.department || 'AB Land and Water Resources Engineering'}
              </p>
            </div>
          </div>

          {/* ABSTRACT */}
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-[#800000] font-serif">Abstract</h3>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-medium justify-text">
              {p.abstract}
            </p>
          </div>

          {/* ACTION BUTTONS: DOWNLOAD & AI ANALYZE GAPS */}
          <div className="pt-4 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200/80">
            
            {/* AI ANALYZE GAPS BUTTON (STUDENT & ADVISER ONLY, OR GUEST PROMPT) */}
            {(canUseAi || !currentUser) && (
              <button
                onClick={handleRunAiAnalysis}
                className="px-6 py-2.5 bg-[#F5B842] hover:bg-[#e0a635] text-[#800000] font-extrabold text-xs rounded-full border border-[#d99e2b] shadow-xs flex items-center space-x-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#800000]" />
                <span>AI Analyze Gaps</span>
              </button>
            )}

            {/* DOWNLOAD BUTTON */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-2.5 bg-[#800000] hover:bg-[#660000] text-white font-extrabold text-xs rounded-full shadow-xs flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing Download...' : 'Download Paper PDF'}</span>
            </button>
          </div>

        </div>

      </main>

      {/* AI GAP ANALYSIS MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#FDFBF7] rounded-3xl border border-gray-200 p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto">
            
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-5 right-5 p-1 text-gray-400 hover:text-[#800000] rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-gray-200/80 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#F5B842] text-[#800000] flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#800000] font-serif">AI Gap Analysis Report</h3>
                <p className="text-xs font-semibold text-gray-600 line-clamp-1">{p.title}</p>
              </div>
            </div>

            {isAnalyzing ? (
              <div className="py-16 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#F5B842] animate-spin mx-auto" />
                <p className="text-sm font-bold text-[#800000]">
                  Analyzing research parameters & identifying future opportunities...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold text-center">
                    {aiError}
                  </div>
                )}
                {aiGaps.map((gap, idx) => (
                  <div key={gap.id || idx} className="flex flex-col bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-6 h-6 rounded-full bg-[#800000] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-1 w-full">
                        <h4 className="text-xs md:text-sm font-extrabold text-[#800000]">
                          {gap.gap_title || gap.title}
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          {gap.description || gap.desc}
                        </p>
                      </div>
                    </div>

                    {/* EXPANDABLE ACCORDION FOR CITATIONS */}
                    {((gap.cited_papers && gap.cited_papers.length > 0) || (gap.online_references && gap.online_references.length > 0)) && (
                      <div className="mt-3 pl-9 border-t border-gray-100 pt-3">
                        <button
                          onClick={() => setOpenPaperAccordionId(openPaperAccordionId === idx ? null : idx)}
                          className="flex items-center space-x-1 text-[10px] font-bold text-[#800000] hover:text-[#F5B842] transition-colors cursor-pointer"
                        >
                          <span>View Cited References ({(gap.cited_papers?.length || 0) + (gap.online_references?.length || 0)})</span>
                          <ChevronDown className={`w-3 h-3 transform transition-transform ${openPaperAccordionId === idx ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {openPaperAccordionId === idx && (
                          <div className="mt-3 space-y-4 max-h-60 overflow-y-auto pr-2">
                            {/* Section A: Internal Repository Context */}
                            {gap.cited_papers && gap.cited_papers.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">
                                  🏛️ Department Repository Footprint
                                </h5>
                                {gap.cited_papers.map((sp, spIdx) => (
                                  <div key={spIdx} className="bg-[#FAF8F5] p-2.5 rounded-lg border border-gray-200/60 shadow-sm">
                                    <div className="flex items-start justify-between">
                                      <span className="text-[9px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded uppercase">ID: {sp.id || 'N/A'}</span>
                                      {sp.year && <span className="text-[9px] font-bold text-gray-500">{sp.year}</span>}
                                    </div>
                                    <p 
                                      className={`text-[10px] font-bold mt-1 leading-snug text-[#800000] hover:underline cursor-pointer`}
                                      onClick={() => {
                                        setShowAiModal(false);
                                        const relatedPaper = { id: sp.id, title: sp.title };
                                        if (onNavigate) onNavigate('paper-details', relatedPaper);
                                      }}
                                    >
                                      {sp.title}
                                    </p>
                                    <p className="text-[9px] text-gray-600 italic mt-1 border-l-2 border-[#F5B842] pl-2">{sp.note}</p>
                                  </div>
                                ))}
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
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs mt-4">
                  <h4 className="text-sm font-extrabold text-[#800000] mb-3">Extracted References</h4>
                  {aiReferences && aiReferences.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2">
                      {aiReferences.map((ref, idx) => (
                        <li key={idx} className="text-xs text-gray-700 leading-relaxed">
                          {ref}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No references extracted.</p>
                  )}
                </div>
              </div>
            )}

            {/* AI ADVISORY BANNER */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-lg my-4 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 font-semibold block text-sm">Academic AI Advisory:</strong>
                <p className="text-amber-800 text-xs sm:text-sm font-medium leading-relaxed mt-1">This gap analysis is generated by AI and may contain inaccuracies. Findings should serve as preliminary exploration and must be independently verified against peer-reviewed literature and faculty guidance.</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col items-end border-t border-gray-200/80 mt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-6 py-2 bg-[#800000] text-white font-bold text-xs rounded-full cursor-pointer hover:bg-[#660000]"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center max-w-sm w-full shadow-2xl space-y-4">
            <Trash2 className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="text-sm font-extrabold text-[#800000]">Confirm Deletion</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Are you sure you want to delete this thesis paper?
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
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

export default PaperDetailsPage;