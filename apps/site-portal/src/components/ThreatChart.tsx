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
import { Activity, PieChart } from 'lucide-react';

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
        <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 h-72 animate-pulse" />
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 h-72 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 24h Attack Volume Chart */}
      <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between shadow-card-subtle">
        <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#3ecf8e]" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#ffffff] font-display">
                24-Hour Threat Mitigation Volume
              </h3>
              <p className="text-[11px] text-[#a0a0a0]">
                Real-time blocked malicious requests per 2-hour window
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#141414] p-0.5 rounded-lg border border-[#2e2e2e]">
            <button
              onClick={() => setChartView('area')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                chartView === 'area'
                  ? 'bg-[#3ecf8e] text-[#000000] font-semibold'
                  : 'text-[#a0a0a0] hover:text-[#ffffff]'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartView('bar')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                chartView === 'bar'
                  ? 'bg-[#3ecf8e] text-[#000000] font-semibold'
                  : 'text-[#a0a0a0] hover:text-[#ffffff]'
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
                    <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="hour"
                  stroke="#525252"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                />
                <YAxis
                  stroke="#525252"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#141414] border border-[#2e2e2e] rounded-lg p-2.5 shadow-xl text-xs">
                          <p className="font-semibold text-[#ffffff]">{label}</p>
                          <p className="text-[#a0a0a0] mt-1 font-mono">
                            Total Attacks: <strong className="text-[#3ecf8e]">{payload[0].value}</strong>
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
                  stroke="#3ecf8e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#attackGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  stroke="#525252"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                />
                <YAxis
                  stroke="#525252"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#141414] border border-[#2e2e2e] rounded-lg p-2.5 text-xs shadow-xl">
                          <p className="font-semibold text-[#ffffff]">{label}</p>
                          <p className="text-[#a0a0a0] mt-1 font-mono">
                            Blocked: <strong className="text-[#3ecf8e]">{payload[0].value}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="attacks" fill="#3ecf8e" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Threat Category Breakdown */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between shadow-card-subtle">
        <div>
          <div className="flex items-center gap-2 pb-4 border-b border-[#262626]">
            <div className="w-6 h-6 rounded-md bg-[#141414] border border-[#2e2e2e] flex items-center justify-center">
              <PieChart className="w-3.5 h-3.5 text-[#3ecf8e]" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#ffffff] font-display">Attack Category Split</h3>
              <p className="text-[11px] text-[#a0a0a0]">Vector breakdown across mitigations</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#ffffff] truncate">{item.displayName}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-[#a0a0a0]">{item.count} hits</span>
                    <span className="font-semibold text-[#3ecf8e]">{item.percentage}%</span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-[#141414] border border-[#262626] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3ecf8e] rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#262626] mt-4 flex items-center justify-between text-xs text-[#a0a0a0]">
          <span>Protection Type</span>
          <span className="font-mono text-[#3ecf8e] font-medium">Automatic Mesh Block</span>
        </div>
      </div>
    </div>
  );
}
