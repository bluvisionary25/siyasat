import React, { useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';

const AccountsPage = ({ onNavigate, currentUser, usersList = [], onUpdateRole, onToggleStatus }) => {
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState(null);
  const [openBlockModalId, setOpenBlockModalId] = useState(null);

  const mockAccounts = [
    { id: 1, email: 'downie.hailienichole@clsu.edu.ph', role: 'Admin', status: 'ACTIVE' },
    { id: 2, email: 'japson.altheamyr@clsu2.edu.ph', role: 'Admin', status: 'ACTIVE' },
    { id: 3, email: 'gervacio.rochelrey@clsu2.edu.ph', role: 'Adviser', status: 'ACTIVE' },
    { id: 4, email: 'valdez.kiervin@clsu2.edu.ph', role: 'Adviser', status: 'ACTIVE' },
    { id: 5, email: 'ortiz.johnlloyd@clsu2.edu.ph', role: 'Adviser', status: 'ACTIVE' },
    { id: 6, email: 'ogena.angelo@clsu2.edu.ph', role: 'Adviser', status: 'ACTIVE' },
    { id: 7, email: 'ruiz.princecathric@clsu2.edu.ph', role: 'Adviser', status: 'ACTIVE' },
    { id: 8, email: 'esteban.emilio@clsu2.edu.ph', role: 'Adviser', status: 'ACTIVE' },
    { id: 9, email: 'delacruz.juan@clsu2.edu.ph', role: 'Adviser', status: 'ACTIVE' },
  ];

  const displayList = usersList.length > 0 ? usersList : mockAccounts;

  const handleRoleSelect = (userId, newRole) => {
    setOpenRoleDropdownId(null);
    if (onUpdateRole) onUpdateRole(userId, newRole);
  };

  const handleConfirmBlock = (user) => {
    if (onToggleStatus) onToggleStatus(user.id, user.status);
    setOpenBlockModalId(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#800000] font-sans relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-16">
      {/* Background Texture */}
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
          <button onClick={() => onNavigate('upload')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">Upload</button>
          <button onClick={() => onNavigate('users')} className="px-5 py-1.5 rounded-full bg-[#F5B842] text-[#800000] font-bold shadow-xs cursor-pointer">Accounts</button>
          <button onClick={() => onNavigate('about')} className="px-5 py-1.5 rounded-full hover:text-[#800000] cursor-pointer">About Us</button>
        </div>

        <div>
          <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-[#F5B842] text-white font-bold text-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-90">
            {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
          </button>
        </div>
      </header>

      {/* ACCOUNTS TABLE CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 pt-4 relative z-10 space-y-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#800000] text-center tracking-tight">
          Account Management
        </h1>

        <div className="bg-[#EFECE6]/30 border border-gray-200 rounded-3xl p-4 shadow-2xs overflow-visible">
          <div className="overflow-x-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[#800000] text-xs font-bold uppercase border-b border-gray-200/80">
                  <th className="p-4 pl-8 w-1/2 text-center">Email</th>
                  <th className="p-4 w-1/4 text-center">Role</th>
                  <th className="p-4 pr-8 w-1/4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60 text-xs font-bold">
                {displayList.map((user) => (
                  <tr key={user.id} className="hover:bg-amber-50/20">
                    <td className="p-3 pl-8 text-gray-800 text-center font-bold">{user.email}</td>
                    <td className="p-3 text-gray-800 text-center font-bold">{user.role || 'Adviser'}</td>
                    <td className="p-3 pr-8 text-center relative">
                      <div className="flex items-center justify-center space-x-2">
                        
                        {/* BLOCK BUTTON & POPOVER */}
                        <div className="relative">
                          <button 
                            onClick={() => {
                              setOpenBlockModalId(openBlockModalId === user.id ? null : user.id);
                              setOpenRoleDropdownId(null);
                            }} 
                            className="px-8 py-1.5 border border-[#800000] text-[#800000] bg-white hover:bg-rose-50 font-semibold text-xs rounded-full cursor-pointer transition-all"
                          >
                            {user.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                          </button>

                          {openBlockModalId === user.id && (
                            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl w-60 z-40 text-center space-y-2">
                              <Lock className="w-5 h-5 text-[#F5B842] mx-auto" />
                              <p className="text-[11px] font-bold text-[#800000]">
                                Are you sure you want to block this user?
                              </p>
                              <button 
                                onClick={() => handleConfirmBlock(user)} 
                                className="px-6 py-1 bg-[#F5B842] text-[#800000] text-xs font-bold rounded-full border border-[#d99e2b] shadow-xs cursor-pointer hover:opacity-90"
                              >
                                Block
                              </button>
                            </div>
                          )}
                        </div>

                        {/* CHANGE ROLE BUTTON & POPOVER */}
                        <div className="relative">
                          <button 
                            onClick={() => {
                              setOpenRoleDropdownId(openRoleDropdownId === user.id ? null : user.id);
                              setOpenBlockModalId(null);
                            }} 
                            className="px-6 py-1.5 bg-[#800000] text-white font-semibold text-xs rounded-full flex items-center space-x-1 cursor-pointer hover:bg-[#660000] transition-all"
                          >
                            <span>Change Role</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {openRoleDropdownId === user.id && (
                            <div className="absolute right-0 top-10 bg-white border border-[#800000]/30 rounded-xl p-3 shadow-2xl w-36 z-40 text-left space-y-1.5">
                              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#800000] font-medium">
                                <input 
                                  type="checkbox" 
                                  checked={user.role === 'ADMIN' || user.role === 'Admin'} 
                                  onChange={() => handleRoleSelect(user.id, 'ADMIN')}
                                  className="accent-[#800000]" 
                                /> 
                                Admin
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#800000] font-medium">
                                <input 
                                  type="checkbox" 
                                  checked={user.role === 'ADVISER' || user.role === 'Adviser'} 
                                  onChange={() => handleRoleSelect(user.id, 'ADVISER')}
                                  className="accent-[#800000]" 
                                /> 
                                Adviser
                              </label>
                            </div>
                          )}
                        </div>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountsPage;