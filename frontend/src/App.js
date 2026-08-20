import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import RepositoryPage from './components/RepositoryPage';
import PaperDetailsPage from './components/PaperDetailsPage';
import UploadPage from './components/UploadPage';
import EditPaperPage from './components/EditPaperPage';
import AccountsPage from './components/AccountsPage';
import StudentProfilePage from './components/StudentProfilePage';
import ProfilePage from './components/ProfilePage';
import AboutUsPage from './components/AboutUsPage';
import AuthModal from './components/AuthModal';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Restore user session from localStorage on load
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('siyasat_user') || 'null') || {
      id: 1,
      full_name: 'Admin User',
      role: 'ADMIN'
    }
  );

  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [theses, setTheses] = useState([]);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    fetchTheses();
    const token = localStorage.getItem('siyasat_token');
    if (token && currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const fetchTheses = async () => {
    try {
      const res = await fetch(`${API_BASE}/theses`);
      if (!res.ok) throw new Error('Failed to fetch theses');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTheses(data);
      } else if (data && Array.isArray(data.theses)) {
        setTheses(data.theses);
      } else {
        setTheses([]);
      }
    } catch (err) {
      console.error('Fetch theses error:', err);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('siyasat_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.users) setUsersList(data.users);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Auth Handlers
  // AuthModal calls onLoginSuccess(token, user) — token first, user second
  const handleLoginSuccess = (token, userData) => {
    localStorage.setItem('siyasat_token', token);
    localStorage.setItem('siyasat_user', JSON.stringify(userData));
    setCurrentUser(userData);
    setShowAuthModal(false);
    if (userData?.role === 'ADMIN') {
      fetchUsers();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('siyasat_token');
    localStorage.removeItem('siyasat_user');
    setCurrentUser(null);
    setCurrentPage('home');
  };

  // ---------------------------------------------------------------------------
  // Navigation — always sets selectedPaper atomically before page switch
  // ---------------------------------------------------------------------------
  const handleNavigate = (page, paperData = null) => {
    const targetPage = page ? String(page).trim() : 'home';

    // Atomically update paper context before switching pages
    if (paperData !== null && paperData !== undefined) {
      setSelectedPaper(paperData);
    }

    if (targetPage === 'upload') {
      if (!currentUser) {
        setShowAuthModal(true);
        return;
      }
      const role = currentUser.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'ADVISER') {
        alert('Access denied. Administrator or Adviser privileges required to upload.');
        return;
      }
    }

    if (targetPage === 'users') {
      if (!currentUser) {
        setShowAuthModal(true);
        return;
      }
      if (currentUser.role?.toUpperCase() !== 'ADMIN') {
        alert('Access denied. Administrator privileges required.');
        return;
      }
      fetchUsers();
    }

    if (
      targetPage === 'edit-paper' ||
      targetPage === 'editpaper' ||
      targetPage === 'edit'
    ) {
      if (!currentUser) {
        setShowAuthModal(true);
        return;
      }
      const role = currentUser.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'ADVISER') {
        alert('Access denied. Only Administrators or Advisers can edit papers.');
        return;
      }
    }

    setCurrentPage(targetPage);
  };

  // ---------------------------------------------------------------------------
  // Admin User Management Handlers
  // ---------------------------------------------------------------------------
  const onUpdateRole = async (userId, newRole) => {
    const token = localStorage.getItem('siyasat_token');
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to update role: ${errData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Network error while updating user role.');
    }
  };

  const onToggleStatus = async (userId, newStatus) => {
    const token = localStorage.getItem('siyasat_token');
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to update status: ${errData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Network error while updating user status.');
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Handler — accepts either a paper object or a raw ID
  // ---------------------------------------------------------------------------
  const handleDeletePaper = async (paperOrId) => {
    const token = localStorage.getItem('siyasat_token');

    let paperId = paperOrId;
    if (typeof paperOrId === 'object' && paperOrId !== null) {
      paperId = paperOrId.id ?? paperOrId.thesis_id ?? paperOrId._id;
    }

    if (!paperId) {
      alert('Cannot delete: Missing or invalid Paper ID.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/theses/${paperId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        await fetchTheses();
        setSelectedPaper(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to delete thesis: ${errData.message || 'Database error'}`);
      }
    } catch (err) {
      console.error('Error deleting paper:', err);
      alert('Network error while attempting to delete paper.');
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const activePage = String(currentPage).trim();
  const userRole = currentUser?.role?.toUpperCase();

  return (
    <div className="min-h-screen bg-[#FDFBF7]">

      {/* HOME */}
      {activePage === 'home' && (
        <HomePage
          onNavigate={handleNavigate}
          currentUser={currentUser}
          thesesList={theses}
          onSelectPaper={(paper) => setSelectedPaper(paper)}
          onOpenAuth={() => setShowAuthModal(true)}
          onLoginClick={() => setShowAuthModal(true)}
          onGoToPortal={() => handleNavigate('repository')}
          onLogout={handleLogout}
        />
      )}

      {/* REPOSITORY */}
      {activePage === 'repository' && (
        <RepositoryPage
          onNavigate={handleNavigate}
          currentUser={currentUser}
          thesesList={theses}
          onSelectPaper={(paper) => setSelectedPaper(paper)}
          onDeletePaper={handleDeletePaper}
          onLogout={handleLogout}
        />
      )}

      {/* PAPER DETAILS */}
      {activePage === 'paper-details' && (
        <PaperDetailsPage
          paper={selectedPaper}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onDeletePaper={handleDeletePaper}
          onLogout={handleLogout}
        />
      )}

      {/* UPLOAD */}
      {activePage === 'upload' && (userRole === 'ADMIN' || userRole === 'ADVISER') && (
        <UploadPage
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onUploadSuccess={fetchTheses}
          onLogout={handleLogout}
        />
      )}

      {/* EDIT PAPER */}
      {(activePage === 'edit-paper' || activePage === 'editpaper' || activePage === 'edit') &&
        (userRole === 'ADMIN' || userRole === 'ADVISER') && (
          <EditPaperPage
            paper={selectedPaper}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onSaveEdit={fetchTheses}
          />
        )}

      {/* ACCOUNTS (ADMIN only) */}
      {(activePage === 'users' || activePage === 'accounts') && userRole === 'ADMIN' && (
        <AccountsPage
          onNavigate={handleNavigate}
          currentUser={currentUser}
          usersList={usersList}
          onUpdateRole={onUpdateRole}
          onToggleStatus={onToggleStatus}
          onLogout={handleLogout}
        />
      )}

      {/* PROFILE */}
      {activePage === 'profile' && (
        userRole === 'STUDENT' ? (
          <StudentProfilePage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        ) : (
          <ProfilePage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )
      )}

      {/* ABOUT */}
      {activePage === 'about' && (
        <AboutUsPage
          onNavigate={handleNavigate}
          currentUser={currentUser}
        />
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          API_BASE={API_BASE}
        />
      )}
    </div>
  );
}