'use client';

import React from 'react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  className?: string;
  badge?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  badge,
}: StatCardProps) {
  return (
    <Card className={cn('p-5 flex flex-col justify-between hover:border-[#cccccc] transition-colors', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#8f8f8f] tracking-tight uppercase">
          {title}
        </span>
        {icon && (
          <div className="w-7 h-7 rounded-full bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center text-[#171717]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#171717] font-mono">
          {value}
        </div>
        {badge}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'font-mono font-medium',
                trend.isNeutral
                  ? 'text-[#8f8f8f]'
                  : trend.isPositive
                  ? 'text-[#166534]'
                  : 'text-[#991b1b]'
              )}
            >
              {trend.value}
            </span>
          )}
          {description && <span className="text-[#8f8f8f] truncate">{description}</span>}
        </div>
      )}
    </Card>
  );
}
