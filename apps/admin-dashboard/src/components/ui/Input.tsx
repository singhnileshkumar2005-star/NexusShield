'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, type, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-[#8f8f8f]">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'w-full h-9 rounded-md border border-[#ebebeb] bg-white px-3 py-1.5 text-sm text-[#171717] placeholder:text-[#8f8f8f]',
            'transition-colors duration-150',
            'focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-9',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
