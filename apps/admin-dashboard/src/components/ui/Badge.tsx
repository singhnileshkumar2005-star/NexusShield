'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'black' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-[#fafafa] text-[#171717] border border-[#ebebeb]',
    outline: 'bg-transparent text-[#4d4d4d] border border-[#ebebeb]',
    black: 'bg-[#171717] text-[#ffffff] border border-[#171717]',
    secondary: 'bg-[#f5f5f5] text-[#4d4d4d] border border-transparent',
    success: 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]',
    danger: 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]',
    warning: 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full transition-colors select-none font-mono tracking-tight',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {children}
    </span>
  );
}
