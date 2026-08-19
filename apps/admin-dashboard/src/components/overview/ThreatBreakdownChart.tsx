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

const MONO_COLORS = ['#171717', '#404040', '#737373', '#a3a3a3'];

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
    color: MONO_COLORS[index % MONO_COLORS.length],
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Threat Category Breakdown</CardTitle>
          <span className="text-xs font-mono text-[#8f8f8f]">
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
                        <div className="bg-[#171717] text-white px-3 py-2 rounded-md text-xs font-mono border border-[#404040]">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-[#a3a3a3]">
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
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#8f8f8f]">
              Loading threat distribution...
            </div>
          )}

          {/* Center Summary Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-mono text-[#171717]">
              {formatNumber(total)}
            </span>
            <span className="text-[10px] text-[#8f8f8f] font-mono uppercase tracking-wider">
              Mitigations
            </span>
          </div>
        </div>

        {/* Legend / Category List */}
        <div className="mt-4 space-y-2 border-t border-[#ebebeb] pt-4">
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
                  <span className="text-[#4d4d4d] truncate font-medium">
                    {badgeMeta.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-[#171717]">{formatNumber(item.value)}</span>
                  <span className="text-[#8f8f8f] w-8 text-right">
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
