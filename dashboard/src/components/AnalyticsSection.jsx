import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, ShieldCheck, Activity, Filter } from 'lucide-react';

const VECTOR_COLORS = {
  'SQL Injection': '#f43f5e',
  'XSS Vector': '#f59e0b',
  'Path Traversal': '#06b6d4',
  'Brute Force': '#8b5cf6',
  'DoS / Flood': '#ec4899',
  'Command Injection': '#10b981'
};

const COLOR_PALETTE = ['#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#10b981', '#ec4899'];

// Custom Tooltip for Area Chart
const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0e131f] border border-[#2a3650] p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs">
        <div className="text-slate-400 font-sans text-[11px] mb-1 font-semibold flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Timeline: {label}</span>
        </div>
        <div className="flex items-center space-x-2 text-white font-bold">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>{payload[0].value} Threats Intercepted</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">100% Deflected by Spoke WAF</div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#0e131f] border border-[#2a3650] p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs">
        <div className="flex items-center space-x-2 font-bold text-white mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.fill || data.color }}></span>
          <span>{data.name}</span>
        </div>
        <div className="text-slate-300">
          Count: <span className="text-white font-bold">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsSection({ distribution, overTime }) {
  const [timeFilter, setTimeFilter] = useState('24h');

  const pieData = (distribution && distribution.length > 0) ? distribution : [
    { name: 'SQL Injection', value: 45 },
    { name: 'XSS Vector', value: 25 },
    { name: 'Path Traversal', value: 18 },
    { name: 'Brute Force', value: 12 }
  ];

  const totalThreats = pieData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const areaData = (overTime && overTime.length > 0) ? overTime : [
    { time: '00:00', count: 3 },
    { time: '04:00', count: 6 },
    { time: '08:00', count: 14 },
    { time: '12:00', count: 22 },
    { time: '16:00', count: 11 },
    { time: '20:00', count: 18 },
    { time: '23:59', count: 8 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Chart 1: Attack Distribution (Donut Chart with Center Metric) */}
      <div className="stripe-card p-5 flex flex-col h-[360px] justify-between">
        
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1a2234]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Attack Vector Breakdown
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">Multi-tenant threat vector classification</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-[#141b2c] text-slate-300 border border-slate-700/60 text-[11px] font-mono">
            {pieData.length} Signatures
          </span>
        </div>

        {/* Chart View with Center Stats */}
        <div className="flex-1 w-full h-full relative flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                stroke="#080b11"
                strokeWidth={2}
              >
                {pieData.map((entry, index) => {
                  const color = VECTOR_COLORS[entry.name] || COLOR_PALETTE[index % COLOR_PALETTE.length];
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={40} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Donut Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {totalThreats}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Total Hits
            </span>
          </div>
        </div>

      </div>

      {/* Chart 2: Attacks Over Time (Area Chart with Linear Gradient Fill) */}
      <div className="stripe-card p-5 flex flex-col h-[360px] justify-between">
        
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1a2234]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Threat Velocity (24h Trend)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">Real-time deflection timeline</p>
            </div>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center space-x-1 p-0.5 bg-[#080b11] border border-[#1a2234] rounded-lg text-[10px] font-mono">
            {['1h', '24h', '7d'].map((pill) => (
              <button
                key={pill}
                onClick={() => setTimeFilter(pill)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  timeFilter === pill 
                    ? 'bg-[#1a2234] text-cyan-300 font-bold border border-cyan-800/40' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Area Chart */}
        <div className="flex-1 w-full h-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cyberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="60%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="cyberStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#161e2e" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#475569" 
                fontSize={11} 
                tickLine={false}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis 
                stroke="#475569" 
                fontSize={11} 
                tickLine={false}
                fontFamily="JetBrains Mono, monospace"
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="url(#cyberStrokeGrad)" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#cyberAreaGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}

