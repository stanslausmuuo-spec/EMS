import React from 'react';
import { cn } from '../../lib/utils';

export function Kicker({ className, children, ...props }) {
  return (
    <p className={cn('eyebrow', className)} {...props}>
      {children}
    </p>
  );
}