import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
  return <div className={cn('shimmer rounded-xl bg-muted', className)} {...props} />;
}
