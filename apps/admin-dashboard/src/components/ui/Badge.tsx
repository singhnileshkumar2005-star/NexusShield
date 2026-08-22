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
    default: 'bg-[#141414] text-[#ffffff] border border-[#2e2e2e]',
    outline: 'bg-transparent text-[#a0a0a0] border border-[#2e2e2e]',
    black: 'bg-[#006239] text-[#3ecf8e] border border-[#3ecf8e]/40',
    secondary: 'bg-[#1a1a1a] text-[#a0a0a0] border border-[#262626]',
    success: 'bg-[#006239]/40 text-[#3ecf8e] border border-[#3ecf8e]/30',
    danger: 'bg-red-950/40 text-red-400 border border-red-800/40',
    warning: 'bg-amber-950/40 text-amber-400 border border-amber-800/40',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg transition-colors select-none font-mono tracking-tight',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3ecf8e]" />
        </span>
      )}
      {children}
    </span>
  );
}
