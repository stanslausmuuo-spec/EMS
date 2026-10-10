import React from 'react';
import { cn } from '../../lib/utils';

export function LivePulse({ active = true, className }) {
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0', className)} aria-hidden="true">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
      )}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_1px] shadow-primary/70" />
    </span>
  );
}

export function LiveBadge({ active = true, label, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-display transition-colors',
        active
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border-strong bg-surface-2 text-muted-foreground',
        className,
      )}
    >
      <LivePulse active={active} />
      {label}
    </span>
  );
}