import React, { useState } from 'react';
import { ChevronDown, Lock, ShieldAlert, Check } from 'lucide-react';
import Navbar from './Navbar';

const AccountsPage = ({ onNavigate, currentUser, usersList = [], onUpdateRole, onToggleStatus }) => {
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState(null);
  const [openBlockModalId, setOpenBlockModalId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Exact fallback mock account data matching the high-fidelity design screenshot
  const defaultMockAccounts = [
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

  const displayList = usersList.length > 0 ? usersList : defaultMockAccounts;

  const handleRoleSelect = async (user, newRole) => {
    setOpenRoleDropdownId(null);
    setUpdatingId(user.id);
    if (onUpdateRole) {
      await onUpdateRole(user.id, newRole);
    }
    setUpdatingId(null);
  };

  const handleConfirmBlock = async (user) => {
    setOpenBlockModalId(null);
    setUpdatingId(user.id);
    const targetStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    if (onToggleStatus) {
      await onToggleStatus(user.id, targetStatus);
    }
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] siyasat-contour-lines text-[#800000]  relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-20">
      
      {/* NAVBAR */}
      <Navbar 
        activePage="accounts" 
        onNavigate={onNavigate} 
        currentUser={currentUser} 
      />

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 pt-4 relative z-10 space-y-8">
        
        {/* PAGE TITLE */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#800000] text-center tracking-tight ">
          Account Management
        </h1>

        {/* ACCOUNTS TABLE CARD */}
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-sm overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-[#800000] text-sm font-extrabold border-b border-gray-200/80 bg-gray-50/50">
                  <th className="p-4 pl-12 w-5/12 text-center border-r border-gray-100">
                    Email
                  </th>
                  <th className="p-4 w-3/12 text-center border-r border-gray-100">
                    Role
                  </th>
                  <th className="p-4 pr-12 w-4/12 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-800">
                {displayList.map((user, idx) => {
                  const isBlocked = user.status === 'BLOCKED';
                  const formattedRole = user.role 
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() 
                    : 'Adviser';

                  return (
                    <tr 
                      key={user.id || idx} 
                      className={`hover:bg-amber-50/30 transition-colors ${
                        isBlocked ? 'bg-rose-50/40 text-gray-500' : ''
                      }`}
                    >
                      {/* EMAIL COLUMN */}
                      <td className="p-3.5 pl-8 text-center font-bold border-r border-gray-100 text-gray-800 text-xs">
                        {user.email}
                        {isBlocked && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                            Blocked
                          </span>
                        )}
                      </td>

                      {/* ROLE COLUMN */}
                      <td className="p-3.5 text-center font-bold border-r border-gray-100 text-gray-800 text-xs">
                        {formattedRole}
                      </td>

                      {/* ACTION COLUMN */}
                      <td className="p-3.5 pr-8 text-center relative">
                        <div className="flex items-center justify-center space-x-3">
                          
                          {/* BLOCK BUTTON & POPOVER */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenBlockModalId(openBlockModalId === user.id ? null : user.id);
                                setOpenRoleDropdownId(null);
                              }}
                              disabled={updatingId === user.id}
                              className={`px-7 py-1.5 border border-[#800000] text-[#800000] bg-white hover:bg-rose-50 font-bold text-xs rounded-full cursor-pointer transition-all shadow-2xs ${
                                isBlocked ? 'bg-red-50 text-red-700 border-red-300' : ''
                              }`}
                            >
                              {isBlocked ? 'Unblock' : 'Block'}
                            </button>

                            {openBlockModalId === user.id && (
                              <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-2xl p-4 shadow-xl w-64 z-50 text-center space-y-3 animate-in fade-in zoom-in-95">
                                <ShieldAlert className="w-6 h-6 text-[#800000] mx-auto" />
                                <p className="text-xs font-bold text-[#800000]">
                                  {isBlocked 
                                    ? `Are you sure you want to unblock ${user.email}?` 
                                    : `Are you sure you want to block ${user.email}?`}
                                </p>
                                <div className="flex justify-center space-x-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmBlock(user)}
                                    className="px-6 py-1.5 bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold rounded-full cursor-pointer transition-all"
                                  >
                                    {isBlocked ? 'Confirm Unblock' : 'Confirm Block'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setOpenBlockModalId(null)}
                                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-full cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* CHANGE ROLE BUTTON & DROPDOWN */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenRoleDropdownId(openRoleDropdownId === user.id ? null : user.id);
                                setOpenBlockModalId(null);
                              }}
                              disabled={updatingId === user.id}
                              className="px-5 py-1.5 bg-[#800000] hover:bg-[#660000] text-white font-bold text-xs rounded-full flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
                            >
                              <span>Change Role</span>
                              <ChevronDown className="w-3.5 h-3.5 ml-1 stroke-[2.5]" />
                            </button>

                            {openRoleDropdownId === user.id && (
                              <div className="absolute right-0 top-11 bg-white border border-[#800000]/20 rounded-xl p-2 shadow-2xl w-40 z-50 text-left space-y-1 animate-in fade-in zoom-in-95">
                                {['ADMIN', 'ADVISER', 'STUDENT'].map((r) => {
                                  const isCurrent = (user.role || '').toUpperCase() === r;
                                  return (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => handleRoleSelect(user, r)}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                        isCurrent 
                                          ? 'bg-[#800000]/10 text-[#800000]' 
                                          : 'text-gray-700 hover:bg-gray-100'
                                      }`}
                                    >
                                      <span>{r.charAt(0) + r.slice(1).toLowerCase()}</span>
                                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#800000]" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountsPage;
