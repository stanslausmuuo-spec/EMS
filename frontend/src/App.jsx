import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ToastProvider } from './components/ui/Toast';
import { TooltipProvider } from './components/ui/Tooltip';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <TooltipProvider delayDuration={200}>
            <MotionConfig reducedMotion="user">
              <ErrorBoundary>
                <AppShell />
              </ErrorBoundary>
            </MotionConfig>
          </TooltipProvider>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
