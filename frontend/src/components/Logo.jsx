import React from 'react';
import { cn } from '../lib/utils';

export function Logo({ className, showText = true }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_-6px] shadow-primary/60">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden="true">
          <rect x="4" y="8" width="4.5" height="16" rx="1.2" fill="currentColor" opacity="0.45" />
          <rect x="10.5" y="8" width="3" height="16" rx="1.2" fill="currentColor" opacity="0.7" />
          <rect x="15.5" y="8" width="7.5" height="16" rx="1.2" fill="currentColor" />
          <circle cx="26.5" cy="24" r="2.6" fill="currentColor" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-hot ring-2 ring-canvas" />
      </span>
      {showText && (
        <span className="flex items-baseline gap-1 font-display text-lg font-bold tracking-display">
          <span>EMS</span>
          <span className="text-primary">.</span>
          <span className="text-muted-foreground">PLATFORM</span>
        </span>
      )}
    </span>
  );
}