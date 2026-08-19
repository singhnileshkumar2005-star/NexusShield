import React from 'react';
import { 
  ShieldAlert, 
  Flame, 
  Server, 
  Activity, 
  ArrowUpRight, 
  Lock, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';

export default function MetricsBar({ stats, isOnline }) {
  const totalBlocked = stats?.total_blocked ?? 0;
  const attacksToday = stats?.attacks_today ?? 0;
  const activeSpokes = stats?.active_spokes ?? 2;
  const networkStatus = isOnline 
    ? (stats?.network_status || "Active & Synchronized") 
    : "Offline Fallback Mode";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Card 1: Total Blocked IPs (Rose Glow) */}
      <div className="stripe-card border-gradient-rose p-5 flex flex-col justify-between group hover:shadow-glow-rose/20 transition-all duration-300">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Global Blocklist
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              {totalBlocked}
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-950/60 text-rose-300 border border-rose-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
              <span>Enforced</span>
            </span>
          </div>
        </div>

        {/* Micro Sparkline + Footer Info */}
        <div className="mt-4 pt-3 border-t border-[#1a2234] flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-sans">
            <span className="text-rose-400 font-medium font-mono">Zero-Knowledge</span> broadcast
          </p>
          {/* Mini SVG Sparkline */}
          <svg className="w-16 h-5 text-rose-500/70" viewBox="0 0 60 20" fill="none">
            <path 
              d="M0 16 L12 14 L24 8 L36 12 L48 4 L60 2" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Card 2: Attacks Deflected Today (Purple / Indigo Glow) */}
      <div className="stripe-card border-gradient-purple p-5 flex flex-col justify-between group hover:shadow-glow-purple/20 transition-all duration-300">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Attacks Deflected
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              {attacksToday}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40 font-mono">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +14.2%
            </span>
          </div>
        </div>

        {/* Micro Sparkline + Footer */}
        <div className="mt-4 pt-3 border-t border-[#1a2234] flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-sans">
            SQLi, XSS & Traversal
          </p>
          {/* Mini SVG Sparkline */}
          <svg className="w-16 h-5 text-purple-500/70" viewBox="0 0 60 20" fill="none">
            <path 
              d="M0 18 L15 15 L30 6 L45 10 L60 2" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Card 3: Connected Spoke Nodes (Emerald Glow) */}
      <div className="stripe-card border-gradient-emerald p-5 flex flex-col justify-between group hover:shadow-glow-emerald/20 transition-all duration-300">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Connected Spokes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Server className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              {activeSpokes}
            </span>
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Online</span>
            </span>
          </div>
        </div>

        {/* Micro Sparkline + Footer */}
        <div className="mt-4 pt-3 border-t border-[#1a2234] flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-mono">
            Ports: 3000 & 3001
          </p>
          {/* Mini SVG Bars */}
          <div className="flex items-end space-x-1 h-5">
            <div className="w-1.5 h-3 bg-emerald-500/60 rounded-t"></div>
            <div className="w-1.5 h-4 bg-emerald-500/80 rounded-t"></div>
            <div className="w-1.5 h-5 bg-emerald-400 rounded-t"></div>
            <div className="w-1.5 h-4 bg-emerald-500/80 rounded-t"></div>
            <div className="w-1.5 h-5 bg-emerald-400 rounded-t"></div>
          </div>
        </div>
      </div>

      {/* Card 4: Network Health & Gossip Sync (Cyan Glow) */}
      <div className="stripe-card border-gradient-cyan p-5 flex flex-col justify-between group hover:shadow-glow-cyan/20 transition-all duration-300">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Network Health
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-bold text-cyan-300 font-mono truncate">
              {isOnline ? '< 10ms Sync' : 'Offline Mode'}
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 font-mono">
              <Zap className="w-3 h-3 mr-0.5 text-cyan-400" />
              <span>Gossip Live</span>
            </span>
          </div>
        </div>

        {/* Micro Sparkline + Footer */}
        <div className="mt-4 pt-3 border-t border-[#1a2234] flex items-center justify-between">
          <p className="text-[11px] text-slate-400 font-sans truncate">
            SHA-256 Bloom Sync
          </p>
          {/* Mini Pulse Indicator */}
          <div className="flex items-center space-x-1 text-cyan-400 font-mono text-[10px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>

    </div>
  );
}

