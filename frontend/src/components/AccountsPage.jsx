import React, { useState, useEffect } from 'react';
import { ChevronDown, Lock, ShieldAlert, Check, X, Trash2 } from 'lucide-react';
import Navbar from './Navbar';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://siyasat-backend.onrender.com/api';

const AccountsPage = ({ onNavigate, currentUser, usersList = [], onUpdateRole, onToggleStatus, onCreateUser, onDeleteUser }) => {
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState(null);
  const [openBlockModalId, setOpenBlockModalId] = useState(null);
  const [openDeleteModalId, setOpenDeleteModalId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'Adviser' });
  const [formError, setFormError] = useState('');

  const [localUsers, setLocalUsers] = useState(usersList);

  useEffect(() => {
    if (usersList.length > 0) {
      setLocalUsers(usersList);
    }
  }, [usersList]);

  const displayList = localUsers;

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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.email.endsWith('@clsu.edu.ph') && !formData.email.endsWith('@clsu2.edu.ph')) {
      setFormError('Access Denied: Only @clsu.edu.ph or @clsu2.edu.ph institutional emails are allowed.');
      return;
    }

    setUpdatingId('creating');
    try {
      const token = localStorage.getItem('siyasat_token');
      if (!token) {
        console.warn('Warning: Missing JWT token. Request to create user aborted.');
        setFormError('Authentication error. Please log in again.');
        setUpdatingId(null);
        return;
      }

      const res = await fetch(`${API_BASE}/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.message || 'Failed to create account.');
        setUpdatingId(null);
        return;
      }
      
      setLocalUsers(prev => [...prev, data.user]);
      setIsAddModalOpen(false);
      setFormData({ full_name: '', email: '', password: '', role: 'Adviser' });
      if (onCreateUser) onCreateUser(data.user);
    } catch (err) {
      setFormError('Network error. Please try again later.');
    }
    setUpdatingId(null);
  };

  const handleConfirmDelete = async (user) => {
    setOpenDeleteModalId(null);
    setUpdatingId(user.id);
    try {
      const token = localStorage.getItem('siyasat_token') || '';
      const res = await fetch(`${API_BASE}/admin/delete-user/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      } else {
        setLocalUsers(prev => prev.filter(u => u.id !== user.id));
        if (onDeleteUser) onDeleteUser(user.id);
      }
    } catch (err) {
      alert('Network error while deleting user.');
    }
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] siyasat-contour-lines text-[#800000] relative overflow-x-hidden selection:bg-[#800000] selection:text-white pb-20">

      {/* Navbar */}
      <Navbar
        activePage="accounts"
        onNavigate={onNavigate}
        currentUser={currentUser}
      />

      {/* Main container */}
      <main className="max-w-6xl mx-auto px-6 pt-4 relative z-10 space-y-8">

        {/* Page title */}
        <div className="flex justify-between items-center flex-col md:flex-row space-y-4 md:space-y-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#800000] text-center md:text-left tracking-tight">
            Account Management
          </h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2.5 bg-[#800000] hover:bg-[#660000] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+ Add Account</span>
          </button>
        </div>

        {/* Accounts table card */}
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
                  const isCurrentUser = currentUser?.id === user.id || currentUser?.email === user.email;

                  return (
                    <tr 
                      key={user.id || idx} 
                      className={`hover:bg-amber-50/30 transition-colors ${
                        isBlocked ? 'bg-rose-50/40 text-gray-500' : ''
                      }`}
                    >
                      {/* Email column */}
                      <td className="p-3.5 pl-8 text-center font-bold border-r border-gray-100 text-gray-800 text-xs">
                        {user.email}
                        {isBlocked && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                            Blocked
                          </span>
                        )}
                      </td>

                      {/* Role column */}
                      <td className="p-3.5 text-center font-bold border-r border-gray-100 text-gray-800 text-xs">
                        {formattedRole}
                      </td>

                      {/* Action column */}
                      <td className="p-3.5 pr-8 text-center relative">
                        <div className="flex items-center justify-center space-x-3">
                          
                          {/* Block button & confirmation popover */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenBlockModalId(openBlockModalId === user.id ? null : user.id);
                                setOpenRoleDropdownId(null);
                              }}
                              disabled={updatingId === user.id || isCurrentUser}
                              className={`px-7 py-1.5 border border-[#800000] text-[#800000] bg-white hover:bg-rose-50 font-bold text-xs rounded-full cursor-pointer transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed ${
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

                          {/* Change role button & dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenRoleDropdownId(openRoleDropdownId === user.id ? null : user.id);
                                setOpenBlockModalId(null);
                              }}
                              disabled={updatingId === user.id || isCurrentUser}
                              className="px-5 py-1.5 bg-[#800000] hover:bg-[#660000] text-white font-bold text-xs rounded-full flex items-center space-x-1 cursor-pointer transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span>Change Role</span>
                              <ChevronDown className="w-3.5 h-3.5 ml-1 stroke-[2.5]" />
                            </button>

                            {openRoleDropdownId === user.id && (
                              <div className="absolute right-0 top-11 bg-white border border-[#800000]/20 rounded-xl p-2 shadow-2xl w-40 z-50 text-left space-y-1 animate-in fade-in zoom-in-95">
                                {['ADMIN', 'ADVISER'].map((r) => {
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

                          {/* Delete button & confirmation popover */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDeleteModalId(openDeleteModalId === user.id ? null : user.id);
                                setOpenRoleDropdownId(null);
                                setOpenBlockModalId(null);
                              }}
                              disabled={updatingId === user.id || isCurrentUser}
                              className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-full flex items-center transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>

                            {openDeleteModalId === user.id && (
                              <div className="absolute right-0 top-11 bg-white border border-red-200 rounded-2xl p-4 shadow-xl w-64 z-50 text-center space-y-3 animate-in fade-in zoom-in-95">
                                <Trash2 className="w-6 h-6 text-red-600 mx-auto" />
                                <p className="text-xs font-bold text-gray-800">
                                  Are you sure you want to delete <span className="text-red-600 break-words">{user.email}</span>?
                                </p>
                                <p className="text-[10px] text-gray-500 font-semibold">This action cannot be undone.</p>
                                <div className="flex justify-center space-x-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDelete(user)}
                                    className="px-6 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full cursor-pointer transition-all"
                                  >
                                    Confirm Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setOpenDeleteModalId(null)}
                                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-full cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
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

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => { setIsAddModalOpen(false); setFormError(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-extrabold text-[#800000] mb-6">Create New Account</h2>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-200">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none text-sm font-semibold" placeholder="Juan Dela Cruz" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email (@clsu.edu.ph or @clsu2.edu.ph)</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none text-sm font-semibold" placeholder="juan@clsu.edu.ph" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none text-sm font-semibold" placeholder="••••••••" minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none text-sm font-bold text-gray-800">
                  <option value="Admin">Admin</option>
                  <option value="Adviser">Adviser</option>
                </select>
              </div>
              <button type="submit" disabled={updatingId === 'creating'} className="w-full mt-6 py-3 bg-[#800000] hover:bg-[#660000] text-white font-extrabold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50">
                {updatingId === 'creating' ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
