import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Stat({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'bg-primary/10 text-primary',
  delay = 0,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-surface-1 p-5 shadow-surface',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accent)}>
          {Icon && <Icon className="h-4 w-4" />}
        </span>
      </div>
      <motion.div
        key={String(value)}
        initial={{ opacity: 0.4, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mt-3 font-display text-3xl font-semibold tabular tracking-display"
      >
        {value}
      </motion.div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}