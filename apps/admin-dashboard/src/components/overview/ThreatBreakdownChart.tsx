'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { CategoryStat } from '@/lib/types';
import { getCategoryBadge, formatNumber } from '@/lib/utils';

interface ThreatBreakdownChartProps {
  data: CategoryStat[];
}

const SUPABASE_COLORS = ['#3ecf8e', '#bda4ff', '#3fcf8e', '#006239', '#525252'];

export function ThreatBreakdownChart({ data }: ThreatBreakdownChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  const chartData = data.map((item, index) => ({
    name: item.label,
    category: item.category,
    value: item.count,
    percentage: item.percentage,
    color: SUPABASE_COLORS[index % SUPABASE_COLORS.length],
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Threat Category Breakdown</CardTitle>
          <span className="text-xs font-mono text-[#3ecf8e]">
            {formatNumber(total)} total IoCs
          </span>
        </div>
        <CardDescription>
          Distribution of mitigated attack vectors across all active nodes
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-2">
        <div className="h-48 w-full relative">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-[#141414] text-white px-3 py-2 rounded-lg text-xs font-mono border border-[#2e2e2e] shadow-xl">
                          <p className="font-semibold text-[#ffffff]">{item.name}</p>
                          <p className="text-[#3ecf8e]">
                            {formatNumber(item.value)} attacks ({item.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#1a1a1a"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#a0a0a0]">
              Loading threat distribution...
            </div>
          )}

          {/* Center Summary Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-mono text-[#ffffff]">
              {formatNumber(total)}
            </span>
            <span className="text-[10px] text-[#a0a0a0] font-mono uppercase tracking-wider">
              Mitigations
            </span>
          </div>
        </div>

        {/* Legend / Category List */}
        <div className="mt-4 space-y-2 border-t border-[#262626] pt-4">
          {chartData.map((item) => {
            const badgeMeta = getCategoryBadge(item.category);
            return (
              <div
                key={item.category}
                className="flex items-center justify-between text-xs py-1"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[#a0a0a0] truncate font-medium">
                    {badgeMeta.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-[#ffffff]">{formatNumber(item.value)}</span>
                  <span className="text-[#3ecf8e] w-8 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
