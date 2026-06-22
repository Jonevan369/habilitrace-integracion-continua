import React from 'react';
import { cn } from '../../lib/utils.js';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-md transition-all duration-300 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/80',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-6 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn('text-xl font-bold tracking-tight font-display text-slate-900 dark:text-white', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-2', className)} {...props} />;
}

