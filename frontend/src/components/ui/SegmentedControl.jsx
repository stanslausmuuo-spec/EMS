import React from 'react';
import { cn } from '../../lib/utils';

export function SegmentedControl({ options, value, onChange, size = 'md', className, ariaLabel }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl border border-border bg-surface-2 p-1 shadow-surface',
        size === 'sm' && 'gap-0.5 rounded-xl p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        const label = typeof opt === 'string' ? opt : opt.label ?? opt.value;
        const valueKey = typeof opt === 'string' ? opt : opt.value;
        return (
          <button
            key={valueKey}
            type="button"
            onClick={() => onChange(valueKey)}
            aria-pressed={isActive}
            className={cn(
              'rounded-xl text-sm font-semibold tracking-display transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              size === 'sm' ? 'rounded-lg px-2.5 py-1 text-xs' : 'px-3.5 py-1.5',
              isActive
                ? 'bg-surface-3 text-foreground shadow-surface ring-1 ring-border-strong'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}