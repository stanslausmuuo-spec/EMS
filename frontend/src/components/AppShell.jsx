import React, { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CommandPalette } from './CommandPalette';
import { ProtectedRoute } from './ProtectedRoute';
import { AIChatWidget } from './AIChatWidget';
import { ScrollToTopButton } from './ScrollToTopButton';
import Home from '../pages/Home';
import EventDetail from '../pages/EventDetail';
import MyTickets from '../pages/MyTickets';
import OrganizerDashboard from '../pages/OrganizerDashboard';
import GateScanner from '../pages/GateScanner';
import ExhibitorLeads from '../pages/ExhibitorLeads';
import EventAgenda from '../pages/EventAgenda';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import NotFound from '../pages/NotFound';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function AppShell() {
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar onOpenCommand={() => setCommandOpen(true)} />
      <main id="main-content" className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/events/:id" element={<PageTransition><EventDetail /></PageTransition>} />
            <Route path="/agenda" element={<PageTransition><EventAgenda /></PageTransition>} />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <PageTransition><MyTickets /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scanner"
              element={
                <ProtectedRoute>
                  <PageTransition><GateScanner /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['Organizer', 'Admin']}>
                  <PageTransition><OrganizerDashboard /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedRoute roles={['Exhibitor', 'Organizer', 'Admin']}>
                  <PageTransition><ExhibitorLeads /></PageTransition>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <AIChatWidget />
      <ScrollToTopButton />
    </div>
  );
}
