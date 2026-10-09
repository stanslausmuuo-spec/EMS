import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ui/Toast';
import { TooltipProvider } from './components/ui/Tooltip';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/AppShell';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <TooltipProvider delayDuration={200}>
              <AppShell />
            </TooltipProvider>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
