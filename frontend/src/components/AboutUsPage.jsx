import React from 'react';
import Navbar from './Navbar';

const AboutUsPage = ({ onNavigate, currentUser, onLoginClick }) => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] siyasat-contour-lines text-[#800000] relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-20">

      {/* Navbar */}
      <Navbar
        activePage="about"
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLoginClick={onLoginClick}
      />

      {/* Main content container */}
      <main className="max-w-4xl mx-auto px-6 pt-4 relative z-10 space-y-10">

        {/* Hero / Intro Section */}
        <div className="text-center space-y-6 max-w-2xl mx-auto py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#800000] tracking-tight leading-snug">
            SIYASAT: A Smarter Research Archive
          </h1>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium">
            SIYASAT is the official digital library for the Department of Agricultural and Biosystems Engineering at Central Luzon State University (CLSU). We do more than just safely store PDF files. By automatically grouping related studies together and using an AI assistant to help students discover new areas of research, SIYASAT transforms old theses into a smart guide for future breakthroughs.
          </p>
        </div>

        {/* Meet the Team */}
        <section className="space-y-8 pt-8 border-t border-gray-200/50 mt-12 pb-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-[#800000]">
              Meet the Team
            </h2>
            <p className="text-sm text-gray-600 font-medium">The minds behind the SIYASAT System.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Hailie Nichole S. Downie",
                role: "Project Leader",
                desc: "Team coordination & milestones",
                initials: "HD"
              },
              {
                name: "Prince Cathric Ruiz",
                role: "Technical Lead",
                desc: "System architecture, full-stack dev & AI integration",
                initials: "PR"
              },
              {
                name: "John Lloyd Ortiz",
                role: "Frontend Developer",
                desc: "React components & UI layout",
                initials: "JO"
              },
              {
                name: "Rochel Rey Gervacio",
                role: "UI/UX Lead",
                desc: "Wireframes & UI design",
                initials: "RG"
              },
              {
                name: "Althea Myr Japson",
                role: "QA Lead",
                desc: "Validation & quality standards",
                initials: "AJ"
              },
              {
                name: "Emilio Esteban",
                role: "QA & Debugging",
                desc: "System testing & bug tracking",
                initials: "EE"
              },
              {
                name: "Angelo Ogena",
                role: "Documentation Lead",
                desc: "Technical & project docs",
                initials: "AO"
              },
              {
                name: "Kiervin Valdez",
                role: "Documentation Lead",
                desc: "Technical & project docs",
                initials: "KV"
              }
            ].map((member, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-100 rounded-3xl py-8 px-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#800000]/30 transition-all duration-300 group flex flex-col items-center justify-center text-center min-h-[160px]"
              >
                <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight">{member.name}</h3>
                <p className="text-xs font-bold text-[#800000] mb-3 bg-[#FAF8F5] px-3 py-1 rounded-full">{member.role}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{member.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default AboutUsPage;
