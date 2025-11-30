'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

const baseInputStyles = `
  w-full px-4 py-3 rounded-xl
  bg-white/80 backdrop-blur-sm
  border border-stone-200
  text-stone-800 placeholder:text-stone-400
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
  hover:border-stone-300
`;

const labelStyles = `
  block text-sm font-medium text-stone-700 mb-2
`;

const helperStyles = `
  text-xs text-stone-500 mt-1.5
`;

const errorStyles = `
  text-xs text-red-500 mt-1.5
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className={labelStyles}>{label}</label>}
        <input
          ref={ref}
          className={`${baseInputStyles} ${error ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
        {helper && !error && <p className={helperStyles}>{helper}</p>}
        {error && <p className={errorStyles}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helper, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className={labelStyles}>{label}</label>}
        <textarea
          ref={ref}
          className={`${baseInputStyles} resize-y min-h-[120px] ${error ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
        {helper && !error && <p className={helperStyles}>{helper}</p>}
        {error && <p className={errorStyles}>{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
