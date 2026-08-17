import React from 'react';
import { ShieldAlert, Flame, Server, Activity, ArrowUpRight } from 'lucide-react';

export default function MetricsBar({ stats, isOnline }) {
  const totalBlocked = stats?.total_blocked ?? 0;
  const attacksToday = stats?.attacks_today ?? 0;
  const activeSpokes = stats?.active_spokes ?? 2;
  const networkStatus = isOnline ? (stats?.network_status || "Active & Synchronized") : "Offline / Offline Fallback";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Card 1: Total Blocked IPs */}
      <div className="cyber-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Blocked IPs</span>
          <div className="w-9 h-9 rounded-lg bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-white font-mono">{totalBlocked}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950/80 text-rose-400 border border-rose-800/50">
            Live Banlist
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center">
          <span className="text-rose-400 font-semibold mr-1">Global Set</span>
          <span>across all registered spokes</span>
        </p>
      </div>

      {/* Card 2: Attacks Deflected Today */}
      <div className="cyber-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Attacks Deflected Today</span>
          <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-white font-mono">{attacksToday}</span>
          <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.4%
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">SQLi, XSS & Path Traversal vectors</p>
      </div>

      {/* Card 3: Connected Websites (Spokes) */}
      <div className="cyber-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Connected Spokes</span>
          <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Server className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-white font-mono">{activeSpokes}</span>
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2 font-mono">Ports: 3000 (Site A), 3001 (Site B)</p>
      </div>

      {/* Card 4: Network Status */}
      <div className="cyber-card rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Network Health</span>
          <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-lg font-bold text-cyan-400 block truncate font-mono">
            {networkStatus}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">10s Sync Interval | Zero-Knowledge Protocol</p>
      </div>

    </div>
  );
}
