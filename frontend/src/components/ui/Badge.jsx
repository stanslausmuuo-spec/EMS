import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-display transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface-2 text-muted-foreground',
        primary: 'border-primary/25 bg-primary/10 text-primary',
        accent: 'border-accent/25 bg-accent/10 text-accent',
        hot: 'border-hot/25 bg-hot/10 text-hot',
        success: 'border-success/25 bg-success/10 text-success',
        warning: 'border-warning/25 bg-warning/10 text-warning',
        danger: 'border-danger/25 bg-danger/10 text-danger',
        outline: 'border-border-strong bg-transparent text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
