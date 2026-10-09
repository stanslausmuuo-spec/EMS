import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '../lib/utils';

export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Sun className={cn('h-4 w-4 transition-all', isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100')} />
      <Moon className={cn('absolute h-4 w-4 transition-all', isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0')} />
    </button>
  );
}
