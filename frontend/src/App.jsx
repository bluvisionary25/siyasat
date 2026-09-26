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

const API_BASE = 'https://siyasat-backend.onrender.com/api';

const ProtectedRoute = ({ isAllowed, redirectPath = 'home', children, onDenied, setCurrentPage, setShowAuthModal, currentUser }) => {
    useEffect(() => {
        if (!isAllowed) {
            onDenied();
        }
    }, [isAllowed, onDenied]);

    return isAllowed ? children : null;
};

// Helper to restore session strictly if valid session exists in localStorage
const getValidSessionUser = () => {
    try {
        const token = localStorage.getItem('siyasat_token');
        const savedUserStr = localStorage.getItem('siyasat_user');
        if (!token || !savedUserStr) {
            return null;
        }

        // Verify JWT expiration if it is a standard JWT token
        const parts = token.split('.');
        if (parts.length === 3) {
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payloadJson = decodeURIComponent(
                atob(payloadBase64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const decoded = JSON.parse(payloadJson);
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem('siyasat_token');
                localStorage.removeItem('siyasat_user');
                return null;
            }
        }

        const parsedUser = JSON.parse(savedUserStr);
        const role = parsedUser?.role?.toUpperCase();
        // Only restore elevated ADMIN or ADVISER view if valid session exists
        if (role === 'ADMIN' || role === 'ADVISER') {
            return parsedUser;
        }
        return null;
    } catch (err) {
        console.warn('Invalid session in localStorage, clearing:', err);
        localStorage.removeItem('siyasat_token');
        localStorage.removeItem('siyasat_user');
        return null;
    }
};

// Helper to determine initial route and search params from browser URL
const getInitialRoute = () => {
    try {
        const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') || params.get('search') || params.get('keyword') || '';
        const pageParam = params.get('page')?.toLowerCase();
        const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();

        let page = pageParam || pathname || hash || 'home';
        if (page === 'repo') page = 'repository';
        if (page === 'about-us' || page === 'aboutus') page = 'about';
        if (page === 'paper' || page === 'details') page = 'paper-details';
        if (page === 'accounts') page = 'users';

        const validPages = ['home', 'repository', 'about', 'paper-details', 'upload', 'users', 'profile', 'login'];
        const resolvedPage = validPages.includes(page) ? page : 'home';

        return {
            page: resolvedPage,
            search: q ? decodeURIComponent(q).trim() : ''
        };
    } catch (e) {
        console.error('Error determining initial route:', e);
        return { page: 'home', search: '' };
    }
};

function App() {
    // Public/unauthenticated users strictly load as guests (null).
    // Only restore ADMIN or ADVISER view if a valid session exists in localStorage.
    const [currentUser, setCurrentUser] = useState(() => getValidSessionUser());

    const initialRoute = getInitialRoute();
    const [currentPage, setCurrentPage] = useState(() => initialRoute.page === 'login' ? 'home' : initialRoute.page);
    const [repositorySearchQuery, setRepositorySearchQuery] = useState(() => initialRoute.search);
    const [pendingDestination, setPendingDestination] = useState(null);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(() => initialRoute.page === 'login');
    const [theses, setTheses] = useState([]);
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('siyasat_token');
        if (token) {
            fetch(`${API_BASE}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    localStorage.setItem('siyasat_user', JSON.stringify(data.user));
                    setCurrentUser(data.user);
                } else if (data.message === 'Invalid or expired token.') {
                    localStorage.removeItem('siyasat_token');
                    localStorage.removeItem('siyasat_user');
                    setCurrentUser(null);
                }
            })
            .catch(err => console.error('Failed to fetch user:', err));
        }
    }, []);

    useEffect(() => {
        fetchTheses();
        const token = localStorage.getItem('siyasat_token');
        if (token && currentUser?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [currentUser]);

    useEffect(() => {
        const handlePopState = () => {
            const route = getInitialRoute();
            if (route.page === 'login') {
                setShowAuthModal(true);
            } else {
                setCurrentPage(route.page);
            }
            if (route.search) {
                setRepositorySearchQuery(route.search);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const fetchTheses = async () => {
        try {
            const res = await fetch('https://siyasat-backend.onrender.com/api/theses');
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
            const res = await fetch('https://siyasat-backend.onrender.com/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data && data.users) setUsersList(data.users);
        } catch (err) {
            console.error('Fetch users error:', err);
        }
    };

    const handleLoginSuccess = (arg1, arg2) => {
        let token = '';
        let userData = null;

        if (typeof arg1 === 'string') {
            token = arg1;
            userData = arg2;
        } else if (typeof arg2 === 'string') {
            token = arg2;
            userData = arg1;
        } else if (arg1 && arg1.token) {
            token = arg1.token;
            userData = arg1.user || arg1;
        }

        if (token) localStorage.setItem('siyasat_token', token);
        if (userData) localStorage.setItem('siyasat_user', JSON.stringify(userData));
        setCurrentUser(userData);
        setShowAuthModal(false);

        if (userData?.role === 'ADMIN') {
            fetchUsers();
        }

        if (pendingDestination) {
            const dest = pendingDestination;
            setPendingDestination(null);
            handleNavigate(dest);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('siyasat_token');
        localStorage.removeItem('siyasat_user');
        setCurrentUser(null);
        setCurrentPage('home');
    };

    // Enhanced navigation handler that accepts optional paper context
    const handleNavigate = (page, extraData = null) => {
        const targetPage = page ? String(page).trim() : 'home';

        // Always update selectedPaper when paper context is provided
        if (extraData !== null && extraData !== undefined) {
            if (typeof extraData === 'object' && (extraData.title || extraData.abstract)) {
                setSelectedPaper(extraData);
            } else if (typeof extraData === 'object' && extraData.searchQuery !== undefined) {
                setRepositorySearchQuery(extraData.searchQuery || '');
            } else if (typeof extraData === 'string' && targetPage === 'repository') {
                setRepositorySearchQuery(extraData);
            }
        }

        if (targetPage === 'upload') {
            if (!currentUser) {
                setPendingDestination('upload');
                setShowAuthModal(true);
                return;
            }
            const role = currentUser.role?.toUpperCase();
            if (role !== 'ADMIN' && role !== 'ADVISER') {
                alert('Access denied. Administrator or Adviser privileges required to upload.');
                return;
            }
        }

        if (targetPage === 'users' || targetPage === 'accounts') {
            if (!currentUser) {
                setPendingDestination('users');
                setShowAuthModal(true);
                return;
            }
            if (currentUser.role?.toUpperCase() !== 'ADMIN') {
                alert('Access denied. Administrator privileges required.');
                return;
            }
            fetchUsers();
        }

        if (targetPage === 'edit-paper' || targetPage === 'editpaper' || targetPage === 'edit') {
            if (!currentUser) {
                setPendingDestination(targetPage);
                setShowAuthModal(true);
                return;
            }
            const role = currentUser.role?.toUpperCase();
            if (role !== 'ADMIN' && role !== 'ADVISER') {
                alert('Access denied. Only Administrators or Advisers can edit papers.');
                return;
            }
        }

        if (targetPage === 'profile' && !currentUser) {
            setPendingDestination('profile');
            setShowAuthModal(true);
            return;
        }

        // Sync browser URL cleanly
        try {
            const urlPath = targetPage === 'home' ? '/' : `/${targetPage}`;
            const queryToEncode = typeof extraData === 'object' && extraData?.searchQuery !== undefined
                ? extraData.searchQuery
                : (typeof extraData === 'string' && targetPage === 'repository' ? extraData : (targetPage === 'repository' ? repositorySearchQuery : ''));
            const searchSuffix = targetPage === 'repository' && queryToEncode ? `?search=${encodeURIComponent(queryToEncode)}` : '';
            window.history.pushState(null, '', `${urlPath}${searchSuffix}`);
        } catch (err) {
            console.warn('URL pushState failed:', err);
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
            const res = await fetch(`https://siyasat-backend.onrender.com/api/theses/${paperId}`, {
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

    const onUpdateRole = async (userId, newRole) => {
        const token = localStorage.getItem('siyasat_token');
        if (!token) {
            alert('Authentication required. Please log in again.');
            return;
        }

        try {
            const res = await fetch(`https://siyasat-backend.onrender.com/api/admin/users/${userId}/role`, {
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
            const res = await fetch(`https://siyasat-backend.onrender.com/api/admin/users/${userId}/status`, {
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
                    onLoginSuccess={handleLoginSuccess}
                    onGoToPortal={() => handleNavigate('repository')}
                    onLogout={handleLogout}
                />
            )}

            {activePage === 'repository' && (
                <RepositoryPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    thesesList={theses}
                    onSelectPaper={(paper) => setSelectedPaper(paper)}
                    onDeletePaper={handleDeletePaper}
                    onLogout={handleLogout}
                    onLoginClick={() => setShowAuthModal(true)}
                    initialSearchQuery={repositorySearchQuery}
                />
            )}

            {activePage === 'paper-details' && (
                <PaperDetailsPage
                    paper={selectedPaper}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onDeletePaper={handleDeletePaper}
                    onLogout={handleLogout}
                    onLoginClick={() => setShowAuthModal(true)}
                />
            )}

            {activePage === 'upload' && (
                <ProtectedRoute
                    isAllowed={currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'ADVISER')}
                    onDenied={() => {
                        if (!currentUser) setShowAuthModal(true);
                        else alert('Uploads are restricted to Faculty Advisers and System Administrators.');
                        setCurrentPage('home');
                    }}
                >
                    <UploadPage
                        onNavigate={handleNavigate}
                        currentUser={currentUser}
                        onUploadSuccess={fetchTheses}
                    />
                </ProtectedRoute>
            )}

            {(activePage === 'edit-paper' || activePage === 'editpaper' || activePage === 'edit') && (
                <ProtectedRoute
                    isAllowed={currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'ADVISER')}
                    onDenied={() => {
                        if (!currentUser) setShowAuthModal(true);
                        else alert('Access denied. Only Administrators or Advisers can edit papers.');
                        setCurrentPage('home');
                    }}
                >
                    <EditPaperPage
                        paper={selectedPaper}
                        onNavigate={handleNavigate}
                        currentUser={currentUser}
                        onSaveEdit={fetchTheses}
                    />
                </ProtectedRoute>
            )}

            {(activePage === 'users' || activePage === 'accounts') && currentUser?.role === 'ADMIN' && (
                <AccountsPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    usersList={usersList}
                    onUpdateRole={onUpdateRole}
                    onToggleStatus={onToggleStatus}
                />
            )}

            {activePage === 'profile' && (
                <ProtectedRoute
                    isAllowed={!!currentUser}
                    onDenied={() => {
                        window.location.replace('/');
                    }}
                >
                    {currentUser?.role === 'STUDENT' ? (
                        <StudentProfilePage
                            currentUser={currentUser}
                            onNavigate={handleNavigate}
                            onLogout={handleLogout}
                            onUpdateUser={setCurrentUser}
                        />
                    ) : (
                        <ProfilePage
                            currentUser={currentUser}
                            onNavigate={handleNavigate}
                            onLogout={handleLogout}
                            onUpdateUser={setCurrentUser}
                        />
                    )}
                </ProtectedRoute>
            )}

            {activePage === 'about' && (
                <AboutUsPage
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onLoginClick={() => setShowAuthModal(true)}
                />
            )}

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

export default App;
