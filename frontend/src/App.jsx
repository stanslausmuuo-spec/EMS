import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyTickets from './pages/MyTickets';
import OrganizerDashboard from './pages/OrganizerDashboard';
import GateScanner from './pages/GateScanner';
import './index.css';

export default () => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} />;
      case 'login':
        return <Login setCurrentPage={setCurrentPage} />;
      case 'register':
        return <Register setCurrentPage={setCurrentPage} />;
      case 'tickets':
        return <MyTickets setCurrentPage={setCurrentPage} />;
      case 'dashboard':
        return <OrganizerDashboard setCurrentPage={setCurrentPage} />;
      case 'scanner':
        return <GateScanner setCurrentPage={setCurrentPage} />;
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar setCurrentPage={setCurrentPage} />
        <main className="flex-1">
          {renderPage()}
        </main>
      </div>
    </AuthProvider>
  );
};
