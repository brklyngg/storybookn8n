'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    ...props
  }, ref) => {
    const baseStyles = `
      rounded-2xl transition-all duration-300
    `;

    const variants = {
      default: `
        bg-white/80 backdrop-blur-sm border border-white/50
        shadow-lg shadow-stone-900/5
      `,
      elevated: `
        bg-white border border-stone-100
        shadow-xl shadow-stone-900/10
        hover:shadow-2xl hover:shadow-stone-900/15
      `,
      bordered: `
        bg-white/60 backdrop-blur-sm
        border-2 border-dashed border-stone-200
        hover:border-amber-400 hover:bg-amber-50/30
      `,
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6 md:p-8',
      lg: 'p-8 md:p-12',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
