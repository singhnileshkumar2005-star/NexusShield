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
    <Card className={cn('p-5 flex flex-col justify-between hover:border-[#3ecf8e]/40 transition-colors shadow-card-subtle', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#a0a0a0] tracking-tight uppercase font-mono">
          {title}
        </span>
        {icon && (
          <div className="w-7 h-7 rounded-lg bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center text-[#3ecf8e]">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#ffffff] font-mono">
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
                  ? 'text-[#a0a0a0]'
                  : trend.isPositive
                  ? 'text-[#3ecf8e]'
                  : 'text-red-400'
              )}
            >
              {trend.value}
            </span>
          )}
          {description && <span className="text-[#a0a0a0] truncate">{description}</span>}
        </div>
      )}
    </Card>
  );
}
