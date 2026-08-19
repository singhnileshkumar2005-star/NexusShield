'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { TimelineDataPoint } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface AttackVolumeChartProps {
  data: TimelineDataPoint[];
}

export function AttackVolumeChart({ data }: AttackVolumeChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Network Attack Velocity (24h)</CardTitle>
          <span className="text-xs font-mono text-[#166534] bg-[#f0fdf4] px-2 py-0.5 rounded-full border border-[#bbf7d0]">
            Live Ingestion
          </span>
        </div>
        <CardDescription>
          Hourly aggregate of probes and attacks neutralized before reaching origin servers
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-2">
        <div className="h-56 w-full">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="monoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#8f8f8f"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#ebebeb' }}
                />
                <YAxis
                  stroke="#8f8f8f"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as TimelineDataPoint;
                      return (
                        <div className="bg-[#171717] text-white p-3 rounded-md text-xs font-mono border border-[#404040] space-y-1">
                          <p className="font-semibold text-white">Time: {label}</p>
                          <div className="border-t border-[#333333] pt-1 space-y-0.5">
                            <p className="text-white font-bold">
                              Total Neutralized: {formatNumber(item.total)}
                            </p>
                            <p className="text-[#a3a3a3]">Brute Force: {item.brute_force}</p>
                            <p className="text-[#a3a3a3]">Honeypot: {item.honeypot_probe}</p>
                            <p className="text-[#a3a3a3]">SQLi/XSS: {item.sqli_xss}</p>
                            <p className="text-[#a3a3a3]">Rate Abuse: {item.rate_abuse}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#171717"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#monoGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#8f8f8f]">
              Loading velocity timeline...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
