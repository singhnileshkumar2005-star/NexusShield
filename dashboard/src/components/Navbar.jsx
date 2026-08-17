import React from 'react';
import { Shield, Activity, Terminal, RefreshCw } from 'lucide-react';

export default function Navbar({ isOnline, lastUpdated, onOpenSimulator, onManualRefresh, isRefreshing }) {
  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">NexusShield</h1>
              <span className="px-2 py-0.5 text-xs font-semibold tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 rounded-full">
                SOC HUB
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Zero-Knowledge Collaborative WAF</p>
          </div>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center space-x-4">
          {/* Connection Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono border ${
            isOnline 
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' 
              : 'bg-amber-950/40 text-amber-400 border-amber-800/50 animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse-glow' : 'bg-amber-500'
            }`}></span>
            <span>{isOnline ? 'Active & Synchronized' : 'Connecting to Threat Hub...'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Attack Simulator Trigger Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-crimson-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-rose-900/30 border border-rose-500/40 transition-all hover:scale-105 active:scale-95"
          >
            <Terminal className="w-4 h-4" />
            <span>Attack Simulator</span>
          </button>
        </div>

      </div>
    </header>
  );
}
