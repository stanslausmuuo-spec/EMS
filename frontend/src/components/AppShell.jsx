import React, { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CommandPalette } from './CommandPalette';
import { ProtectedRoute } from './ProtectedRoute';
import { AIChatWidget } from './AIChatWidget';
import { ScrollToTopButton } from './ScrollToTopButton';
import { ErrorBoundary } from './ErrorBoundary';
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function RouteErrorBoundary({ children }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.key}>{children}</ErrorBoundary>;
}

export function AppShell() {
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
    <div className="relative flex min-h-screen flex-col bg-canvas text-foreground">
      <Navbar onOpenCommand={() => setCommandOpen(true)} />
      <main id="main-content" className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <RouteErrorBoundary>
                <PageTransition>
                  <Home />
                </PageTransition>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/events/:id"
            element={
              <RouteErrorBoundary>
                <PageTransition>
                  <EventDetail />
                </PageTransition>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/agenda"
            element={
              <RouteErrorBoundary>
                <PageTransition>
                  <EventAgenda />
                </PageTransition>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <RouteErrorBoundary>
                  <PageTransition>
                    <MyTickets />
                  </PageTransition>
                </RouteErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <RouteErrorBoundary>
                  <PageTransition>
                    <GateScanner />
                  </PageTransition>
                </RouteErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['Organizer', 'Admin']}>
                <RouteErrorBoundary>
                  <PageTransition>
                    <OrganizerDashboard />
                  </PageTransition>
                </RouteErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute roles={['Exhibitor', 'Organizer', 'Admin']}>
                <RouteErrorBoundary>
                  <PageTransition>
                    <ExhibitorLeads />
                  </PageTransition>
                </RouteErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <RouteErrorBoundary>
                <PageTransition>
                  <Login />
                </PageTransition>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/register"
            element={
              <RouteErrorBoundary>
                <PageTransition>
                  <Register />
                </PageTransition>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/terms"
            element={
              <RouteErrorBoundary>
                <PageTransition>
                  <Terms />
                </PageTransition>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/privacy"
            element={
              <RouteErrorBoundary>
                <PageTransition>
                  <Privacy />
                </PageTransition>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="*"
            element={
              <RouteErrorBoundary>
                <PageTransition>
                  <NotFound />
                </PageTransition>
              </RouteErrorBoundary>
            }
          />
        </Routes>
      </main>
      <Footer />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <AIChatWidget />
      <ScrollToTopButton />
    </div>
  );
}