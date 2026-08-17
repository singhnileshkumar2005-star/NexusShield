import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { PieChart as PieIcon, TrendingUp } from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#a855f7', '#10b981'];

export default function AnalyticsSection({ distribution, overTime }) {
  const pieData = (distribution && distribution.length > 0) ? distribution : [
    { name: 'SQL Injection', value: 45 },
    { name: 'XSS Vector', value: 25 },
    { name: 'Path Traversal', value: 18 },
    { name: 'Brute Force', value: 12 }
  ];

  const areaData = (overTime && overTime.length > 0) ? overTime : [
    { time: '00:00', count: 2 },
    { time: '04:00', count: 5 },
    { time: '08:00', count: 12 },
    { time: '12:00', count: 18 },
    { time: '16:00', count: 8 },
    { time: '20:00', count: 15 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      
      {/* Chart 1: Attack Distribution (Donut Chart) */}
      <div className="cyber-card rounded-xl p-4 flex flex-col h-[320px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
          <div className="flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Attack Vector Distribution
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Category Breakdown</span>
        </div>

        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Attacks Over Time (Area Chart) */}
      <div className="cyber-card rounded-xl p-4 flex flex-col h-[320px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Attack Frequency (24h Trend)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Real-Time Timeline</span>
        </div>

        <div className="flex-1 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#06b6d4" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAttacks)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
