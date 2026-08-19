import React, { useState } from 'react';
import { 
  Shield, 
  Activity, 
  Terminal, 
  RefreshCw, 
  LayoutDashboard, 
  Lock, 
  Key, 
  Copy, 
  Check, 
  ChevronRight, 
  Radio, 
  Command,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  isOnline, 
  currentView = 'admin',
  onSwitchView,
  onOpenSimulator, 
  onManualRefresh, 
  isRefreshing,
  apiKey = 'nexus_dev_key_2026',
  activeClientId = 'client_A'
}) {
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const maskedKey = apiKey.length > 14 
    ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` 
    : apiKey;

  return (
    <header className="sticky top-0 z-40 border-b border-[#1a2234] bg-[#080b11]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand + Breadcrumbs */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Logo with Multi-gradient Halo */}
            <div className="relative group cursor-pointer" onClick={() => onSwitchView && onSwitchView('admin')}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-cyan-500 to-emerald-500 rounded-xl blur-[3px] opacity-70 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-9 h-9 bg-[#0e131f] rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-1.5 text-xs font-mono">
              <span 
                onClick={() => onSwitchView && onSwitchView('admin')}
                className="font-bold text-white tracking-tight cursor-pointer hover:text-cyan-400 transition-colors text-sm sm:text-base font-sans"
              >
                NexusShield
              </span>
              
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

              <span className="text-slate-400 font-medium hidden sm:inline">
                {currentView === 'admin' ? 'Global SOC Hub' : 'Client Portal'}
              </span>

              {currentView === 'client' && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 text-[11px]">
                    {activeClientId}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Center: Segmented View Switcher */}
          {onSwitchView && (
            <div className="hidden md:flex items-center p-1 bg-[#0e131f] border border-[#1a2234] rounded-xl shadow-inner text-xs font-mono">
              <button
                onClick={() => onSwitchView('admin')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  currentView === 'admin'
                    ? 'bg-[#1a2234] text-white shadow-sm border border-slate-700/60 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Global SOC Hub</span>
                {currentView === 'admin' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>

              <button
                onClick={() => onSwitchView('client')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                  currentView === 'client'
                    ? 'bg-[#1a2234] text-white shadow-sm border border-slate-700/60 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Client Portal</span>
                {currentView === 'client' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                )}
              </button>
            </div>
          )}

          {/* Right: Telemetry Indicators & Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Live SSE Status Pill */}
            <div 
              className={`flex items-center space-x-2 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
                isOnline
                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-amber-950/30 text-amber-300 border-amber-800/40 animate-pulse'
              }`}
              title={isOnline ? 'SSE stream connected & synchronized' : 'Reconnecting to SSE stream...'}
            >
              <div className="relative flex items-center justify-center">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                {isOnline && (
                  <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold">
                {isOnline ? 'SSE Live' : 'Connecting'}
              </span>
            </div>

            {/* API Key Copy Pill */}
            <button
              onClick={handleCopyKey}
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#0e131f] hover:bg-[#141b2c] border border-[#1a2234] hover:border-slate-700 text-[11px] font-mono text-slate-300 transition-colors group"
              title="Click to copy API Key"
            >
              <Key className="w-3 h-3 text-purple-400 group-hover:text-purple-300" />
              <span className="text-slate-400">Key:</span>
              <span className="text-slate-200 font-semibold">{maskedKey}</span>
              {copiedKey ? (
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Check className="w-3 h-3" />
                  <span className="text-[10px]">Copied!</span>
                </span>
              ) : (
                <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-white bg-[#0e131f] hover:bg-[#141b2c] border border-[#1a2234] hover:border-slate-700 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              title="Manual Sync Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Attack Simulator Trigger Button with Keyboard Shortcut Badge */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-rose-900/30 border border-rose-400/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Attack Simulator</span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.2 rounded bg-black/30 border border-white/20 text-[10px] font-mono text-rose-200">
                ⌘K
              </span>
            </button>

          </div>

        </div>

        {/* Mobile View Switcher */}
        {onSwitchView && (
          <div className="md:hidden flex items-center justify-between pb-3 pt-1 border-t border-slate-800/60">
            <div className="flex w-full space-x-2 text-xs font-mono">
              <button
                onClick={() => onSwitchView('admin')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 ${
                  currentView === 'admin'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-bold'
                    : 'bg-[#0e131f] text-slate-400 border border-[#1a2234]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Global SOC</span>
              </button>
              <button
                onClick={() => onSwitchView('client')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 ${
                  currentView === 'client'
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-bold'
                    : 'bg-[#0e131f] text-slate-400 border border-[#1a2234]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Client Portal</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}

