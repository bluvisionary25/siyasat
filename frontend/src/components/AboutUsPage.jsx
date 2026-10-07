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

        {/* Header title */}
        <div className="text-center space-y-1">
          <p className="text-sm font-extrabold text-[#800000] tracking-wide">
            The Department of
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#800000] tracking-tight">
            Agricultural and Biosystems Engineering
          </h1>
        </div>

        {/* Mission */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-[#800000]">
            Mission
          </h2>
          <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-medium">
            To provide engineering and technology expertise in the field of agriculture and affiliated industries for the country, the region, and beyond.
          </p>
        </section>

        {/* Objectives */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-[#800000]">
            Objectives
          </h2>
          <ul className="space-y-2 text-xs md:text-sm text-gray-700 leading-relaxed font-medium pl-2">
            <li className="flex items-start space-x-2">
              <span className="text-[#800000] font-black text-base leading-none">•</span>
              <span>To develop relevant and quality curricular programs of the department.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#800000] font-black text-base leading-none">•</span>
              <span>To produce quality graduates of the programs offered by the department within the allowable residencies.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#800000] font-black text-base leading-none">•</span>
              <span>To generate innovative technologies and systems for the production and post-production of safe and secure food, bioproducts and bioenergy with smart utilization and management of the environment and natural resources.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#800000] font-black text-base leading-none">•</span>
              <span>To provide engineering and technology expertise in the field of agriculture and affiliated industries for the country, the region and beyond.</span>
            </li>
          </ul>
        </section>

        {/* Areas of specialization */}
        <section className="space-y-6">
          <h2 className="text-xl font-extrabold text-[#800000]">
            Areas of Specialization
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div className="bg-[#FAF8F5]/90 border border-gray-200/80 rounded-3xl p-8 text-center flex items-center justify-center shadow-2xs hover:shadow-sm transition-all min-h-[140px]">
              <h3 className="text-base font-extrabold text-[#800000] leading-snug">
                AB Machinery and<br />Power Engineering
              </h3>
            </div>

            <div className="bg-[#FAF8F5]/90 border border-gray-200/80 rounded-3xl p-8 text-center flex items-center justify-center shadow-2xs hover:shadow-sm transition-all min-h-[140px]">
              <h3 className="text-base font-extrabold text-[#F5B842] leading-snug">
                AB Land and Water<br />Resources Engineering
              </h3>
            </div>

            <div className="bg-[#FAF8F5]/90 border border-gray-200/80 rounded-3xl p-8 text-center flex items-center justify-center shadow-2xs hover:shadow-sm transition-all min-h-[140px]">
              <h3 className="text-base font-extrabold text-[#F5B842] leading-snug">
                AB Structures and<br />Environment Engineering
              </h3>
            </div>

            <div className="bg-[#FAF8F5]/90 border border-gray-200/80 rounded-3xl p-8 text-center flex items-center justify-center shadow-2xs hover:shadow-sm transition-all min-h-[140px]">
              <h3 className="text-base font-extrabold text-[#800000] leading-snug">
                AB Process<br />Engineering
              </h3>
            </div>

          </div>
        </section>

        {/* Program overview */}
        <section className="pt-2">
          <p className="text-xs text-gray-700 leading-relaxed font-medium justify-text">
            The BSABE program is designed to produce graduates who possess knowledge, skills, and attitudes in the application of engineering science and designs to the processes and systems involved in the sustainable production, post-production, and processing of safe food, feed, fiber, timber, and other agricultural and biological materials; the efficient utilization, conservation, and management of natural and renewable resources; and development of climate change mitigation measures, in order to enhance human health in harmony with the environment. Agricultural and Biosystems (AB) consist of crops, poultry, livestock, fisheries and aquaculture resources, forestry and other plants, new and renewable energy, wastes, natural resources, and climate. The graduates of BSABE are expected to understand and apply engineering science and designs to identify, analyze, and create solutions for problems concerning land development; irrigation and drainage including dams, farm roads and bridges; AB production machinery; new and renewable energy; AB buildings and structures; postharvest and processing technologies; climate change, and natural resources, environmental and waste management.
          </p>
        </section>

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
