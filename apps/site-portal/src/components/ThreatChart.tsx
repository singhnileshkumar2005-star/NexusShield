'use client';

import React, { useState, useEffect } from 'react';
import { useSite } from '@/lib/site-context';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Activity, PieChart, ShieldAlert } from 'lucide-react';

export function ThreatChart() {
  const { hourlyData, categoryBreakdown } = useSite();
  const [mounted, setMounted] = useState(false);
  const [chartView, setChartView] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 h-72 animate-pulse" />
        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 h-72 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 24h Attack Volume Chart */}
      <div className="lg:col-span-2 bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-[#ebebeb]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#171717]" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#171717]">
                24-Hour Threat Mitigation Volume
              </h3>
              <p className="text-[11px] text-[#8f8f8f]">
                Real-time blocked malicious requests per 2-hour window
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#fafafa] p-0.5 rounded-full border border-[#ebebeb]">
            <button
              onClick={() => setChartView('area')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                chartView === 'area'
                  ? 'bg-[#171717] text-[#ffffff]'
                  : 'text-[#4d4d4d] hover:text-[#171717]'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartView('bar')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                chartView === 'bar'
                  ? 'bg-[#171717] text-[#ffffff]'
                  : 'text-[#4d4d4d] hover:text-[#171717]'
              }`}
            >
              Bar
            </button>
          </div>
        </div>

        <div className="h-56 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'area' ? (
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="hour"
                  stroke="#8f8f8f"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#ebebeb' }}
                />
                <YAxis
                  stroke="#8f8f8f"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#ebebeb' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-2.5 shadow-none text-xs">
                          <p className="font-semibold text-[#171717]">{label}</p>
                          <p className="text-[#4d4d4d] mt-1 font-mono">
                            Total Attacks: <strong className="text-[#171717]">{payload[0].value}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attacks"
                  stroke="#171717"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#attackGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  stroke="#8f8f8f"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#ebebeb' }}
                />
                <YAxis
                  stroke="#8f8f8f"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#ebebeb' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-2.5 text-xs">
                          <p className="font-semibold text-[#171717]">{label}</p>
                          <p className="text-[#4d4d4d] mt-1 font-mono">
                            Blocked: <strong className="text-[#171717]">{payload[0].value}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="attacks" fill="#171717" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Threat Category Breakdown */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-4 border-b border-[#ebebeb]">
            <div className="w-6 h-6 rounded-md bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center">
              <PieChart className="w-3.5 h-3.5 text-[#171717]" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#171717]">Attack Category Split</h3>
              <p className="text-[11px] text-[#8f8f8f]">Vector breakdown across mitigations</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#171717] truncate">{item.displayName}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-[#8f8f8f]">{item.count} hits</span>
                    <span className="font-semibold text-[#171717]">{item.percentage}%</span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-[#fafafa] border border-[#ebebeb] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#171717] rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#ebebeb] mt-4 flex items-center justify-between text-xs text-[#8f8f8f]">
          <span>Protection Type</span>
          <span className="font-mono text-[#171717] font-medium">Automatic Mesh Block</span>
        </div>
      </div>
    </div>
  );
}
