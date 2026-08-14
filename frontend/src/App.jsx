import React, { useState, useEffect } from 'react';
import HomePage from './HomePage';
import RepositoryPage from './components/RepositoryPage';
import PaperDetailsPage from './components/PaperDetailsPage';
import UploadPage from './components/UploadPage';
import EditPaperPage from './components/EditPaperPage';
import AccountsPage from './components/AccountsPage';
import StudentProfilePage from './components/StudentProfilePage';
import ProfilePage from './components/ProfilePage';
import AboutUsPage from './components/AboutUsPage';
import AuthModal from './components/AuthModal';

function App() {
    const [currentPage, setCurrentPage] = useState('home');

    const [currentUser, setCurrentUser] = useState({
        id: 1,
        full_name: 'Admin User',
        role: 'ADMIN'
    });

    const [selectedPaper, setSelectedPaper] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [theses, setTheses] = useState([]);
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        fetchTheses();
    }, []);

    const fetchTheses = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/theses');
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
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data && data.users) setUsersList(data.users);
        } catch (err) {
            console.error('Fetch users error:', err);
        }
    };

    const handleLoginSuccess = (userData, token) => {
        localStorage.setItem('siyasat_token', token);
        setCurrentUser(userData);
        setShowAuthModal(false);

        if (userData.role === 'ADMIN') {
            fetchUsers();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('siyasat_token');
        setCurrentUser(null);
        setCurrentPage('home');
    };

    // Enhanced navigation handler that accepts optional paper context
    const handleNavigate = (page, paperData = null) => {
        const targetPage = page ? String(page).trim() : 'home';

        // Always update selectedPaper when paper context is provided
        if (paperData !== null && paperData !== undefined) {
            setSelectedPaper(paperData);
        }

        if (targetPage === 'upload') {
            if (!currentUser) {
                setShowAuthModal(true);
                return;
            }
            if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISER') {
                alert('Access denied. Administrator or Adviser privileges required to upload.');
                return;
            }
        }

        if (targetPage === 'users') {
            if (!currentUser) {
                setShowAuthModal(true);
                return;
            }
            if (currentUser.role !== 'ADMIN') {
                alert('Access denied. Administrator privileges required.');
                return;
            }
            fetchUsers();
        }

        if (targetPage === 'edit-paper' || targetPage === 'editpaper' || targetPage === 'edit') {
            if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISER')) {
                alert('Access denied. Only Administrators or Advisers can edit papers.');
                return;
            }
        }

        setCurrentPage(targetPage);
    };

    // Robust delete handler for PostgreSQL integer IDs
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
            const res = await fetch(`http://localhost:5000/api/theses/${paperId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                await fetchTheses();
                setSelectedPaper(null);
            } else {
                const errData = await res.json();
                alert(`Failed to delete thesis: ${errData.message || 'Database error'}`);
            }
        } catch (err) {
            console.error('Error deleting paper:', err);
            alert('Network error while attempting to delete paper.');
        }
    };

    const activePage = String(currentPage).trim();

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {activePage === 'home' && (
                <HomePage
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    thesesList={theses}
                    onSelectPaper={(paper) => setSelectedPaper(paper)}
                    onOpenAuth={() => setShowAuthModal(true)}
                    onLoginClick={() => setShowAuthModal(true)}
                    onGoToPortal={() => handleNavigate('repository')}
                />
            )}

            {activePage === 'repository' && (
                <RepositoryPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    thesesList={theses}
                    onSelectPaper={(paper) => setSelectedPaper(paper)}
                    onDeletePaper={handleDeletePaper}
                />
            )}

            {activePage === 'paper-details' && (
                <PaperDetailsPage
                    paper={selectedPaper}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onDeletePaper={handleDeletePaper}
                />
            )}

            {activePage === 'upload' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'ADVISER') && (
                <UploadPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onUploadSuccess={fetchTheses}
                />
            )}

            {(activePage === 'edit-paper' || activePage === 'editpaper' || activePage === 'edit') &&
                (currentUser?.role === 'ADMIN' || currentUser?.role === 'ADVISER') && (
                    <EditPaperPage
                        paper={selectedPaper}
                        onNavigate={handleNavigate}
                        currentUser={currentUser}
                        onSaveEdit={fetchTheses}
                    />
                )}

            {activePage === 'users' && currentUser?.role === 'ADMIN' && (
                <AccountsPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    usersList={usersList}
                />
            )}

            {activePage === 'profile' && (
                currentUser?.role === 'STUDENT' ? (
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

            {activePage === 'about' && (
                <AboutUsPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                />
            )}

            {showAuthModal && (
                <AuthModal
                    onClose={() => setShowAuthModal(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}
        </div>
    );
}

export default App;