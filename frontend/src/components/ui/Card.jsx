import React from 'react';
import { cn } from '../../lib/utils';

const TIERS = {
  1: 'bg-surface-1 border-border',
  2: 'bg-surface-2 border-border',
  3: 'bg-surface-3 border-border-strong',
  inset: 'bg-inset border-border',
};

export const Surface = React.forwardRef(function Surface(
  { className, tier = 1, hairline = true, raised = false, as: Comp = 'div', ...props },
  ref,
) {
  return (
    <Comp
      ref={ref}
      className={cn(
        'rounded-2xl border',
        TIERS[tier] || TIERS[1],
        raised ? 'shadow-elevate' : 'shadow-surface',
        hairline && 'bg-clip-padding',
        className,
      )}
      {...props}
    />
  );
});

export function Card({ className, ...props }) {
  return (
    <Surface
      tier={1}
      className={cn('text-card-foreground', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn('font-display text-lg font-semibold tracking-display', className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div className={cn('flex items-center gap-3 p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
  );
}
