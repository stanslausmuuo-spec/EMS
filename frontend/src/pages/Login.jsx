import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Sparkles } from 'lucide-react';

export default ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (loginEmail, loginPassword) => {
    setError('');
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        login(data.data);
        setCurrentPage('home');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error during login');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-2 text-center">Login to EMS</h2>
      <p className="text-center text-sm text-slate-500 mb-6">Explore the Event Management System</p>

      {/* Quick Demo Login Box */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-semibold text-sm mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Quick Demo Access (One-Click)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button"
            onClick={() => handleLogin('organizer@ems.local', 'password123')}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
          >
            Login as Organizer
          </button>
          <button 
            type="button"
            onClick={() => handleLogin('attendee@ems.local', 'password123')}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 rounded text-xs font-medium transition"
          >
            Login as Attendee
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="e.g. organizer@ems.local"
            required 
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••"
            required 
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent text-sm"
          />
        </div>
        <button type="submit" className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded text-sm hover:opacity-95 transition">
          Sign In
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Don't have an account? <button onClick={() => setCurrentPage('register')} className="text-blue-600 font-medium hover:underline">Register</button>
      </p>
    </div>
  );
};
