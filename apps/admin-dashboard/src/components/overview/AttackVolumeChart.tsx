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
          <span className="text-xs font-mono text-[#3ecf8e] bg-[#006239]/40 px-2 py-0.5 rounded-md border border-[#3ecf8e]/30">
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
                  <linearGradient id="supabaseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#525252"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                />
                <YAxis
                  stroke="#525252"
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
                        <div className="bg-[#141414] text-white p-3 rounded-lg text-xs font-mono border border-[#2e2e2e] shadow-xl space-y-1">
                          <p className="font-semibold text-white">Time: {label}</p>
                          <div className="border-t border-[#262626] pt-1 space-y-0.5">
                            <p className="text-[#3ecf8e] font-bold">
                              Total Neutralized: {formatNumber(item.total)}
                            </p>
                            <p className="text-[#a0a0a0]">Brute Force: {item.brute_force}</p>
                            <p className="text-[#a0a0a0]">Honeypot: {item.honeypot_probe}</p>
                            <p className="text-[#a0a0a0]">SQLi/XSS: {item.sqli_xss}</p>
                            <p className="text-[#a0a0a0]">Rate Abuse: {item.rate_abuse}</p>
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
                  stroke="#3ecf8e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#supabaseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#a0a0a0]">
              Loading velocity timeline...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
