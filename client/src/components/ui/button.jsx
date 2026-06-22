import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const variants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50 active:scale-98',
  {
    variants: {
      variant: {
        default: 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm hover:shadow-md active:bg-violet-800 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400',
        secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
        outline: 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300',
        ghost: 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-5'
      }
    },
    defaultVariants: { variant: 'default', size: 'md' }
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(variants({ variant, size }), className)} {...props} />;
}

