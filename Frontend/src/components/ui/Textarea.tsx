import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
        <textarea
          ref={ref} id={inputId}
          className={`block w-full rounded-lg border px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors text-[15px] ${error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500'} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
