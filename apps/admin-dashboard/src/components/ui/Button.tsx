'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#3ecf8e] text-[#000000] font-semibold hover:bg-[#3fcf8e] border border-transparent shadow-sm',
      secondary:
        'bg-[#1a1a1a] text-[#ffffff] hover:bg-[#222222] border border-[#2e2e2e] hover:border-[#3ecf8e]/40',
      outline:
        'bg-transparent text-[#ffffff] hover:bg-[#1a1a1a] border border-[#2e2e2e]',
      ghost:
        'bg-transparent text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#1a1a1a] border border-transparent',
      danger:
        'bg-red-950/60 text-red-400 hover:bg-red-900 border border-red-800/40',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-9',
      lg: 'text-sm px-6 py-2.5 gap-2.5 h-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : (
          icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="inline-flex shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
