import React, { useState } from 'react';

const AuthModal = ({ isOpen, onClose, onLoginSuccess, API_BASE }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADVISER');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    // Try primary route or fallback route if backend uses /signup
    const endpoint = isSignUp 
      ? `${API_BASE}/auth/register` 
      : `${API_BASE}/auth/login`;

    const payload = isSignUp 
      ? { full_name: fullName, email, password, role } 
      : { email, password };

    try {
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // If /auth/register fails with 404 HTML, try /auth/signup as fallback
      if (!response.ok && isSignUp && response.status === 404) {
        response = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(`Server returned status ${response.status}. Check your backend Express auth route URL.`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed. Please check your inputs.');
      }

      if (isSignUp) {
        setSuccessMsg('Account created successfully! Switching to Log In...');
        setTimeout(() => {
          setIsSignUp(false);
          setSuccessMsg('');
        }, 1500);
      } else {
        onLoginSuccess(data.token, data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="relative w-full max-w-5xl bg-[#800000] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] border border-white/10">
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 z-20 text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full shadow-md cursor-pointer">
          ✕
        </button>

        <div className="md:col-span-5 relative flex flex-col justify-center items-center text-center p-8 text-white bg-[#800000]">
          <div className="relative z-10 space-y-4">
            <div className="inline-block border-4 border-white px-6 py-2 rounded-2xl mb-2 backdrop-blur-sm">
              <span className="text-4xl md:text-5xl font-black font-serif">SIYASAT</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold">A Research and Thesis Repository with AI Gap Analysis Tool</h2>
          </div>
        </div>

        <div className="md:col-span-7 bg-white p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="border-b-2 border-[#800000] pb-2 mb-6">
              <h2 className="text-3xl font-bold text-[#800000]">{isSignUp ? 'Sign Up' : 'Log In'}</h2>
            </div>

            <p className="text-[#800000] text-sm font-medium mb-8">Hello! Please put your details to continue</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{error}</div>}
            {successMsg && <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div className="relative">
                  <input type="text" required id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder=" " className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent" />
                  <label htmlFor="fullName" className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#800000]">Name</label>
                </div>
              )}

              <div className="relative">
                <input type="email" required id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent" />
                <label htmlFor="email" className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#800000]">Email</label>
              </div>

              <div className="relative">
                <input type="password" required id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " className="peer w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent" />
                <label htmlFor="password" className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#800000]">Password</label>
              </div>

              {isSignUp && (
                <div className="relative">
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-400 text-gray-800 focus:outline-none focus:border-[#800000] text-sm bg-transparent cursor-pointer">
                    <option value="STUDENT">Student</option>
                    <option value="ADVISER">Adviser / Faculty</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                  <label htmlFor="role" className="absolute left-3 -top-2.5 bg-white px-2 text-xs font-bold text-[#800000]">Role</label>
                </div>
              )}

              <div className="text-right text-xs text-[#800000] italic pt-1">
                {isSignUp ? (
                  <span>Already have an account? <button type="button" onClick={() => { setIsSignUp(false); setError(''); }} className="font-bold underline not-italic hover:text-black cursor-pointer">Log In!</button></span>
                ) : (
                  <span>Don’t have an account yet? <button type="button" onClick={() => { setIsSignUp(true); setError(''); }} className="font-bold underline not-italic hover:text-black cursor-pointer">Sign up!</button></span>
                )}
              </div>

              <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#F5B842] text-[#800000] font-bold text-base rounded-xl border border-[#d99e2b] shadow-sm cursor-pointer mt-4">
                {isLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;