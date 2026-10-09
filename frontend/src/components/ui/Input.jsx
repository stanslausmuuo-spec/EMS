import React from 'react';
import { cn } from '../../lib/utils';

const base =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60';

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(base, className)} {...props} />;
});

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(base, 'min-h-[96px] resize-y', className)} {...props} />;
});

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        base,
        'appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20stroke%3D%27currentColor%27%20stroke-width%3D%272%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27%2F%3E%3C%2Fsvg%3E")] pr-10',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({ label, hint, error, required, children, className }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      {label && (
        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-xs font-medium text-danger">{error}</span>
      ) : (
        hint && <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}
