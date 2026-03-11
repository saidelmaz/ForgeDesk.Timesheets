import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> { children: ReactNode; }

export function Card({ children, className = '', ...props }: CardProps) {
  return <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800 ${className}`} {...props}>{children}</div>;
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-800 ${className}`} {...props}>{children}</div>;
}

export function CardContent({ children, className = '', ...props }: CardProps) {
  return <div className={`px-6 py-5 ${className}`} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }: CardProps) {
  return <div className={`px-6 py-4 border-t border-slate-100 dark:border-slate-800 ${className}`} {...props}>{children}</div>;
}
