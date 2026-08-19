import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ShieldAlert, Server, Activity, ShieldCheck, UserX, RefreshCw, Flame, Users, LayoutDashboard } from 'lucide-react';
import ClientPortal from './ClientPortal';

const HUB_URL = import.meta.env.VITE_HUB_API || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://nexusshield.onrender.com');

export default function App() {
  const [currentView, setCurrentView] = useState('admin'); // 'admin' | 'client'
  const [blockedIps, setBlockedIps] = useState([]);
  const [stats, setStats] = useState({ total_blocked: 0, active_spokes: 2 });
  const [isOnline, setIsOnline] = useState(true);
  const [isUnbanning, setIsUnbanning] = useState(null);

  // Fetch stats and blocklist from FastAPI Hub for Admin SOC
  const fetchData = useCallback(async () => {
    try {
      const [blocklistRes, statsRes] = await Promise.all([
        axios.get(`${HUB_URL}/blocklist`, { timeout: 2500 }),
        axios.get(`${HUB_URL}/stats`, { timeout: 2500 })
      ]);

      if (blocklistRes.data && Array.isArray(blocklistRes.data.blocked_ips)) {
        const normalized = blocklistRes.data.blocked_ips.map((item, idx) => {
          if (typeof item === 'object' && item !== null) {
            return {
              ip: item.ip || item.ip_address || '127.0.0.1',
              timestamp: item.timestamp || new Date().toLocaleTimeString(),
              attack_type: item.attack_type || 'SQL Injection',
              client_id: item.client_id || 'default'
            };
          }
          return {
            ip: String(item),
            timestamp: new Date(Date.now() - idx * 60000).toLocaleTimeString(),
            attack_type: 'SQL Injection',
            client_id: 'default'
          };
        });
        setBlockedIps(normalized);
      }

      if (statsRes.data) {
        setStats(statsRes.data);
      }

      setIsOnline(true);
    } catch (error) {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'admin') {
      fetchData();
      const intervalId = setInterval(fetchData, 3000);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, currentView]);

  const handleUnban = async (ip) => {
    setIsUnbanning(ip);
    try {
      await axios.delete(`${HUB_URL}/unban/${encodeURIComponent(ip)}`);
      
      setBlockedIps(prev => prev.filter(item => item.ip !== ip));
      setStats(prev => ({
        ...prev,
        total_blocked: Math.max(0, prev.total_blocked - 1)
      }));

      fetchData();
    } catch (error) {
      console.error(`Failed to unban IP ${ip}:`, error);
    } finally {
      setIsUnbanning(null);
    }
  };

  if (currentView === 'client') {
    return <ClientPortal onBackToAdmin={() => setCurrentView('admin')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-12">
      
      {/* 1. Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">NexusShield SOC</h1>
              <p className="text-xs text-slate-400 font-mono">Visual Threat Intelligence Hub</p>
            </div>
          </div>

          {/* Navigation Controls & Status */}
          <div className="flex items-center space-x-3">
            
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'admin'
                    ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin SOC</span>
              </button>

              <button
                onClick={() => setCurrentView('client')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
                  currentView === 'client'
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Client Portal</span>
              </button>
            </div>

            {/* Pulsing Network Indicator */}
            <div className={`hidden md:flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-mono font-medium ${
              isOnline 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
                : 'bg-amber-950/60 text-amber-400 border-amber-800/60 animate-pulse'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}></span>
              <span>{isOnline ? 'Network Online' : 'Connecting to Hub...'}</span>
            </div>

            <button 
              onClick={fetchData} 
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Manual Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* 2. Metrics Row (KPI Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Total Blocked Threats Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-rose-800/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Total Blocked Threats
              </span>
              <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl font-extrabold text-white font-mono">
                {stats.total_blocked ?? blockedIps.length}
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-950 text-rose-300 border border-rose-800/50 font-mono">
                Global Blocklist
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Active attacker IPs denied access across all spokes</p>
          </div>

          {/* Active Nodes Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-emerald-800/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Active Nodes (Spokes)
              </span>
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl font-extrabold text-white font-mono">
                {stats.active_spokes ?? 2}
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Protected</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">Site A (3000) & Site B (3001) connected</p>
          </div>

          {/* Threat Intelligence Status Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-cyan-800/50 transition-all md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Threat Intelligence Sync
              </span>
              <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-cyan-400 font-mono">
                3s Polling Loop
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Zero-Knowledge cross-site immunization active</p>
          </div>

        </div>

        {/* 3. Global Blocklist Data Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono">
                Global Blocked IPs Registry
              </h2>
            </div>
            <span className="px-2.5 py-1 text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
              {blockedIps.length} Active Bans
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-800/70 text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <th className="py-3 px-4">Attacker IP Address</th>
                  <th className="py-3 px-4">Attack Classification</th>
                  <th className="py-3 px-4">Mock Timestamp</th>
                  <th className="py-3 px-4">Target Client</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {blockedIps.length > 0 ? (
                  blockedIps.map((item, index) => {
                    const isRevoking = isUnbanning === item.ip;
                    return (
                      <tr key={`${item.ip}-${index}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-rose-300">{item.ip}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50 text-[11px]">
                            {item.attack_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{item.timestamp}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                            {item.client_id || 'default'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span>Globally Banned</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleUnban(item.ip)}
                            disabled={isRevoking}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-md shadow-red-900/30"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>{isRevoking ? 'Revoking...' : 'Revoke'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                      No blocked IP addresses registered in global hub. Run attack simulation to test.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>
    </div>
  );
}
