import React from 'react';
import { cn } from '../lib/utils';

export function Logo({ className, showText = true }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-surface">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M7 10h18M7 16h18M7 22h11"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText && (
        <span className="font-display text-lg font-semibold tracking-tight">
          EMS<span className="text-muted-foreground">Platform</span>
        </span>
      )}
    </span>
  );
}
