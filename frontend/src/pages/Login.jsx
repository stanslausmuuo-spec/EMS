import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to EMS</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-transparent"
          />
        </div>
        <button type="submit" className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded hover:opacity-90">
          Sign In
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Don't have an account? <button onClick={() => setCurrentPage('register')} className="text-blue-600 font-medium">Register</button>
      </p>
    </div>
  );
};
