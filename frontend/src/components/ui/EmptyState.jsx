import React from 'react';
import { cn } from '../../lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'grain relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border-strong bg-surface-1/60 px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="relative mb-5">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/25 blur-2xl" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
            <Icon className="h-7 w-7" />
          </div>
        </div>
      )}
      <h3 className="font-display text-xl font-semibold tracking-display text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="relative z-10 mt-6">{action}</div>}
    </div>
  );
}