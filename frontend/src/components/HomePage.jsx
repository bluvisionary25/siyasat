import React, { useState } from 'react';
import { Search, Building, Sprout, GraduationCap, Award } from 'lucide-react';

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

  // 1. Static fallback list so cards display immediately if DB is empty
  const defaultFallbackPapers = [
    {
      id: 1,
      department: 'AB Machinery',
      title: 'Development and Performance Evaluation of a Solar-Powered Grain Dryer for Rice Postharvest Processing',
      author: 'Dela Cruz, A., Downie, H., & Japson, A.',
      abstract: 'This study aims to design and evaluate a solar-powered dryer for reducing moisture content in freshly harvested palay...',
    },
    {
      id: 2,
      department: 'AB Land and Water',
      title: 'Flood Monitoring and Early Warning System using IoT Sensors and Real-time Data Analytics',
      author: 'Haslina Farhana, Mohd Ismail, & Aliff Afira',
      abstract: 'In tropical regions, seasonal flooding presents major safety challenges. This research develops a low-cost IoT sensor network for flood prediction...',
    },
    {
      id: 3,
      department: 'AB Processing',
      title: 'Animal Space Requirement Calculator: A Tool to Estimate Space Allocation for Livestock and Poultry',
      author: 'Lachaona, N. P., Gabriel, C. T., & Macabale, N. A.',
      abstract: 'Animal space allowance greatly influences animal welfare and farm efficiency. This paper introduces an interactive tool for space calculation...',
    },
    {
      id: 4,
      department: 'AB Structures',
      title: 'Design Optimization of Controlled Environment Agriculture Facilities for High-Value Crops',
      author: 'Santos, M. R., & Villanueva, E. K.',
      abstract: 'Evaluation of microclimate parameters inside greenhouse structures optimized for Central Luzon weather conditions...',
    }
  ];

  // 2. Dynamic DB selection: Uses backend theses if available, else uses fallback
  const displayPapers = (Array.isArray(thesesList) && thesesList.length > 0)
    ? thesesList.slice(0, 4)
    : defaultFallbackPapers;

  const handleFormUpload = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

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
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 antialiased selection:bg-[#800000] selection:text-white">
      {/* ------------------ HERO SECTION ------------------ */}
      <section className="relative bg-[#800000] text-white pt-6 pb-24 px-6 md:px-12 overflow-hidden">
        <nav className="max-w-7xl mx-auto flex items-center justify-between relative z-10 mb-16">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black tracking-wider uppercase font-serif">SIYASAT</span>
          </div>

          <div className="hidden md:flex items-center space-x-1 bg-white/10 backdrop-blur-md rounded-full px-5 py-1.5 border border-white/20 text-xs font-medium">
            <button onClick={() => onNavigate('home')} className="px-4 py-1.5 rounded-full bg-white/20 text-white cursor-pointer">Home</button>
            <button onClick={() => onNavigate('repository')} className="px-4 py-1.5 rounded-full hover:bg-white/10 text-white/90 cursor-pointer">Repository</button>

            {isElevatedUser && (
              <a href="#upload-section" className="px-4 py-1.5 rounded-full hover:bg-white/10 text-white/90 cursor-pointer">Upload</a>
            )}

            {isAdmin && (
              <button onClick={() => onNavigate('users')} className="px-4 py-1.5 rounded-full hover:bg-white/10 text-white/90 cursor-pointer">Accounts</button>
            )}

            <button onClick={() => onNavigate('about')} className="px-4 py-1.5 rounded-full hover:bg-white/10 text-white/90 cursor-pointer">About Us</button>
          </div>

          {currentUser ? (
            <button
              onClick={() => onNavigate('profile')}
              className="w-9 h-9 rounded-full bg-[#F5B842] text-[#800000] font-bold text-base flex items-center justify-center shadow-md border border-white/30 cursor-pointer"
            >
              {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
            </button>
          ) : (
            <button onClick={onLoginClick} className="text-xs bg-white/15 border border-white/30 text-white font-medium px-4 py-2 rounded-full cursor-pointer">Log In</button>
          )}
        </nav>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6 pt-4 pb-12">
          <div className="flex justify-center mb-2">
            <span className="text-5xl md:text-6xl font-black tracking-widest font-serif border-4 border-white px-6 py-2 rounded-xl backdrop-blur-sm">SIYASAT</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">A Research and Thesis Repository with AI Gap Analysis Tool</h1>
          <p className="text-lg md:text-xl font-light text-white/80 tracking-wide">CLSU Department of Agricultural and Biosystems Engineering</p>
          <div className="pt-6">
            {currentUser ? (
              <button onClick={() => onNavigate('repository')} className="px-10 py-3.5 bg-white text-[#800000] font-semibold rounded-full shadow-lg hover:bg-slate-100 cursor-pointer">Go to Repository Portal</button>
            ) : (
              <button onClick={onLoginClick} className="px-10 py-3.5 bg-white/15 border border-white/30 text-white font-semibold rounded-full shadow-lg backdrop-blur-md cursor-pointer">Log In</button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white rounded-t-[50%] scale-x-150 transform translate-y-6" />
      </section>

      {/* ------------------ PILLARS SECTION ------------------ */}
      <section id="about" className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-semibold tracking-wider text-[#800000] uppercase mb-1">The Department of</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#800000]">Agricultural and Biosystems Engineering</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#faf8f6] border border-gray-100 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center">
            <Building className="w-10 h-10 text-[#800000] mb-4" />
            <h3 className="text-lg font-bold text-[#800000] mb-3">Foundation</h3>
            <p className="text-xs text-gray-600 leading-relaxed">The Department of Agricultural and Biosystems Engineering is one of four departments under CLSU's College of Engineering.</p>
          </div>
          <div className="bg-[#faf8f6] border border-gray-100 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center">
            <Sprout className="w-10 h-10 text-[#800000] mb-4" />
            <h3 className="text-lg font-bold text-[#800000] mb-3">Mission</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Trains engineers to apply engineering science and design to sustainable production and materials handling.</p>
          </div>
          <div className="bg-[#faf8f6] border border-gray-100 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center">
            <GraduationCap className="w-10 h-10 text-[#800000] mb-4" />
            <h3 className="text-lg font-bold text-[#800000] mb-3">Curriculum</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Offers the BSABE program covering soil and water engineering, farm power, and agricultural processing.</p>
          </div>
          <div className="bg-[#faf8f6] border border-gray-100 rounded-3xl p-6 text-center shadow-sm flex flex-col items-center">
            <Award className="w-10 h-10 text-[#800000] mb-4" />
            <h3 className="text-lg font-bold text-[#800000] mb-3">Legacy</h3>
            <p className="text-xs text-gray-600 leading-relaxed">A respected center for agricultural engineering education and research in Central Luzon.</p>
          </div>
        </div>
      </section>

      {/* ------------------ DYNAMIC REPOSITORY PREVIEW ------------------ */}
      <section id="repository" className="relative bg-[#800000] text-white pt-16 pb-20 px-6 md:px-12 mt-12">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Research and Thesis Repository</h2>
            <div className="relative max-w-xl mx-auto">
              <input type="text" placeholder="Search some keywords..." className="w-full bg-black/20 text-white placeholder-white/50 border border-white/20 rounded-full py-3 pl-12 pr-6 text-sm backdrop-blur-md" />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-10">
            {displayPapers.map((p, idx) => (
              <div
                key={p.id || p._id || idx}
                onClick={() => {
                  if (onSelectPaper) onSelectPaper(p);
                  onNavigate('paper-details');
                }}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex flex-col justify-between shadow-md hover:bg-white/20 cursor-pointer transition-all"
              >
                <div>
                  {/* Department Badge matching PostgreSQL column name */}
                  <span className="inline-block bg-white/20 text-white text-[10px] font-medium px-3 py-1 rounded-full mb-3">
                    {p.department || p.branch || 'ABE Department'}
                  </span>
                  <h4 className="text-sm font-semibold leading-snug mb-2 line-clamp-3">{p.title}</h4>
                  <p className="text-[11px] text-white/70 italic mb-3">by {p.author || p.authors}</p>
                  <p className="text-xs text-white/80 leading-relaxed line-clamp-3">{p.abstract}</p>
                </div>
                <div className="pt-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPaper) onSelectPaper(p);
                      onNavigate('paper-details');
                    }}
                    className="px-4 py-1.5 bg-white/15 hover:bg-white/30 text-white text-xs font-medium rounded-full border border-white/20 cursor-pointer transition-all"
                  >
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------ UPLOAD SECTION (ADMIN & ADVISER) ------------------ */}
      {isElevatedUser && (
        <section id="upload-section" className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="bg-[#faf8f6] border border-gray-200/80 rounded-3xl p-8 md:p-12 shadow-sm relative">
            <h2 className="text-2xl md:text-3xl font-bold text-[#800000] text-center mb-8">Upload Your Paper</h2>

            <form onSubmit={handleFormUpload} className="space-y-4">
              <div className="relative">
                <input type="text" required id="title" value={uploadData.title} onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })} placeholder=" " className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent" />
                <label htmlFor="title" className="absolute left-3 -top-2.5 bg-[#faf8f6] px-2 text-xs font-bold text-[#800000]">Title</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input type="text" required id="author" value={uploadData.author} onChange={(e) => setUploadData({ ...uploadData, author: e.target.value })} placeholder=" " className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent" />
                  <label htmlFor="author" className="absolute left-3 -top-2.5 bg-[#faf8f6] px-2 text-xs font-bold text-[#800000]">Author</label>
                </div>
                <div className="relative">
                  <input type="number" required id="year" value={uploadData.year} onChange={(e) => setUploadData({ ...uploadData, year: e.target.value })} placeholder=" " className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent" />
                  <label htmlFor="year" className="absolute left-3 -top-2.5 bg-[#faf8f6] px-2 text-xs font-bold text-[#800000]">Year Accepted</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input type="text" id="branch" value={uploadData.branch} onChange={(e) => setUploadData({ ...uploadData, branch: e.target.value })} placeholder=" " className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent" />
                  <label htmlFor="branch" className="absolute left-3 -top-2.5 bg-[#faf8f6] px-2 text-xs font-bold text-[#800000]">Branch</label>
                </div>
                <div className="relative">
                  <input type="text" id="keywords" value={uploadData.keywords} onChange={(e) => setUploadData({ ...uploadData, keywords: e.target.value })} placeholder=" " className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent" />
                  <label htmlFor="keywords" className="absolute left-3 -top-2.5 bg-[#faf8f6] px-2 text-xs font-bold text-[#800000]">Keywords</label>
                </div>
              </div>

              <div className="relative">
                <textarea
                  required
                  rows={6}
                  id="abstract"
                  value={uploadData.abstract}
                  onChange={(e) => setUploadData({ ...uploadData, abstract: e.target.value })}
                  placeholder=" "
                  className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent resize-none"
                />
                <label htmlFor="abstract" className="absolute left-3 -top-2.5 bg-[#faf8f6] px-2 text-xs font-bold text-[#800000]">Abstract</label>

                {showSuccessPopup && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 flex flex-col items-center justify-center p-6 text-center shadow-lg z-20">
                    <p className="text-[#800000] text-xs md:text-sm font-bold mb-4">
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
                <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} className="w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-500 text-sm bg-transparent cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#800000] file:text-white" />
                <label className="absolute left-3 -top-2.5 bg-[#faf8f6] px-2 text-xs font-bold text-[#800000]">File Upload</label>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#F5B842] text-[#800000] font-bold text-base rounded-xl border border-[#d99e2b] shadow-sm cursor-pointer">
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ------------------ FOOTER ------------------ */}
      <footer className="bg-[#faf8f6] text-gray-700 pt-16 pb-12 px-6 md:px-12 border-t border-gray-200/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-[#800000] mb-4">Title</h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm">CLSU Department of Agricultural and Biosystems Engineering Thesis Repository.</p>
          </div>
          <div className="md:text-center">
            <h3 className="text-xl font-bold text-[#800000] mb-4">Links</h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• Home</li>
              <li>• Repository</li>
              <li>• About Us</li>
            </ul>
          </div>
          <div className="md:text-right">
            <h3 className="text-xl font-bold text-[#800000] mb-4">Contact Us</h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• Central Luzon State University</li>
            </ul>
          </div>
        </div>
        <div className="text-center relative z-10 mt-8">
          <h1 className="text-[14vw] font-black text-[#800000]/20 tracking-widest font-serif select-none">SIYASAT</h1>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;