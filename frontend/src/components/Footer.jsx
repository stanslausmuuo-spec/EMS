import React from 'react';
import { ShieldCheck, Lock, Activity } from 'lucide-react';

export default ({ setCurrentPage }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">© 2026 EMS Event Platform</span>
        </div>

        <div className="flex items-center space-x-6">
          <button onClick={() => setCurrentPage('terms')} className="hover:text-blue-600 transition">Terms & Conditions</button>
          <button onClick={() => setCurrentPage('privacy')} className="hover:text-blue-600 transition">Privacy Policy</button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center space-x-1 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted & Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
