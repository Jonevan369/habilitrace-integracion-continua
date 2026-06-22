import React from 'react';
import { cn } from '../../lib/utils.js';

export function Badge({ className, variant = 'default', ...props }) {
  const styles = {
    default: 'bg-violet-50 text-violet-700 ring-violet-100/60 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900/50',
    secondary: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700/40',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900/50',
    gold: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900/50',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/50',
    red: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900/50'
  };
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 transition-colors duration-200', styles[variant] ?? styles.default, className)}
      {...props}
    />
  );
}

