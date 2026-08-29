import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Ticket, ShieldCheck, LogOut, User } from 'lucide-react';

export default ({ setCurrentPage }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold p-2 rounded text-lg">EMS</div>
          <span className="font-bold text-xl tracking-tight">Event Platform</span>
        </div>

        <div className="flex items-center space-x-6">
          <button onClick={() => setCurrentPage('home')} className="flex items-center space-x-1 hover:text-blue-600 font-medium">
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </button>

          {user && (
            <button onClick={() => setCurrentPage('tickets')} className="flex items-center space-x-1 hover:text-blue-600 font-medium">
              <Ticket className="w-4 h-4" />
              <span>My Tickets</span>
            </button>
          )}

          {user && (user.role === 'Organizer' || user.role === 'Admin') && (
            <button onClick={() => setCurrentPage('dashboard')} className="flex items-center space-x-1 hover:text-blue-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Organizer Dashboard</span>
            </button>
          )}

          {user && (
            <button onClick={() => setCurrentPage('scanner')} className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-semibold">
              <span>Gate Scanner</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-4 pl-4 border-l border-slate-200 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{user.name} ({user.role})</span>
              </span>
              <button onClick={logout} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-red-600" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-slate-800">
              <button onClick={() => setCurrentPage('login')} className="px-4 py-2 text-sm font-semibold hover:text-blue-600">Login</button>
              <button onClick={() => setCurrentPage('register')} className="px-4 py-2 text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded">Register</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
