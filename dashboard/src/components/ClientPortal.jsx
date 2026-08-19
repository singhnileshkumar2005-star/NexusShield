import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, Key, Lock, Search, RefreshCw, Activity, Terminal } from 'lucide-react';

const DEFAULT_HUB_URL = import.meta.env.VITE_HUB_API || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://nexusshield.onrender.com');

export default function ClientPortal({ onBackToAdmin, hubUrl = DEFAULT_HUB_URL }) {
  const [clientIdInput, setClientIdInput] = useState('client_A');
  const [activeClientId, setActiveClientId] = useState('client_A');
  const [clientData, setClientData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Fetch client-specific telemetry from FastAPI backend
  const fetchClientStats = useCallback(async (targetCid) => {
    const cid = targetCid || activeClientId;
    if (!cid.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await axios.get(`${hubUrl}/client-stats/${encodeURIComponent(cid.trim())}`, { timeout: 3000 });
      if (response.data) {
        setClientData(response.data);
        setIsOnline(true);
      }
    } catch (err) {
      console.error(`Failed to fetch client stats for ${cid}:`, err);
      setErrorMsg(`Could not connect or fetch telemetry for Client ID "${cid}". Ensure backend is live.`);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeClientId, hubUrl]);

  // Submit handler for Client ID search form
  const handleLoadClient = (e) => {
    if (e) e.preventDefault();
    if (!clientIdInput.trim()) return;
    setActiveClientId(clientIdInput.trim());
    fetchClientStats(clientIdInput.trim());
  };

  // Quick preset selector handler
  const handleSelectPreset = (presetId) => {
    setClientIdInput(presetId);
    setActiveClientId(presetId);
    fetchClientStats(presetId);
  };

  // Automatic 3-Second Background Polling Loop for live multi-tenant telemetry updates
  useEffect(() => {
    fetchClientStats(activeClientId);
    const interval = setInterval(() => {
      fetchClientStats(activeClientId);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchClientStats, activeClientId]);

  const recentLogs = clientData?.recent_logs || clientData?.blocked_ips || [];
  const totalBlocked = clientData?.total_blocked ?? clientData?.stats?.total_blocked ?? recentLogs.length;

  return (
    <div className="text-slate-200 font-sans pb-12">
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto pt-2">
        
        {/* Client ID Selection & Search Control Card */}
        <div className="cyber-card bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <form onSubmit={handleLoadClient} className="flex-1 flex items-center space-x-3">
              <div className="relative flex-1 max-w-md">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="Enter Client ID (e.g. client_A, client_B, Site-A)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-semibold rounded-lg shadow-md shadow-cyan-900/30 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Load Telemetry</span>
              </button>
            </form>

            {/* Client ID Quick Select Pills */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-400">Presets:</span>
              <button
                onClick={() => handleSelectPreset('client_A')}
                className={`px-3 py-1 rounded-full border transition-all ${
                  activeClientId === 'client_A'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                client_A
              </button>
              <button
                onClick={() => handleSelectPreset('client_B')}
                className={`px-3 py-1 rounded-full border transition-all ${
                  activeClientId === 'client_B'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                client_B
              </button>
            </div>

          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-mono flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => fetchClientStats(activeClientId)}
              className="px-3 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metrics Row (Read-Only Tenant KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Total Client Attacks Card */}
          <div className="cyber-card bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-cyan-800/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Client Attacks Prevented
              </span>
              <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-4xl font-extrabold text-white font-mono">
                {totalBlocked}
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-mono">
                Tenant Isolated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Total blocked attacks logged specifically for {activeClientId}</p>
          </div>

          {/* Active Protection Status */}
          <div className="cyber-card bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-emerald-800/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                WAF Protection Status
              </span>
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                Active & Enforced
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Protected</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">Zero-Knowledge automated threat defense</p>
          </div>

          {/* Sync & Live Telemetry Card */}
          <div className="cyber-card bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-blue-800/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Active Client Scope
              </span>
              <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-400 font-mono">
                {activeClientId}
              </span>
              <button
                onClick={() => fetchClientStats(activeClientId)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Refresh Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Filtered REST API: <code>/client-stats/{activeClientId}</code></p>
          </div>

        </div>

        {/* Read-Only Client Threat Logs Table */}
        <div className="cyber-card bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono">
                Client Attack Logs ({activeClientId})
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
                Read-Only Access
              </span>
              <span className="px-2.5 py-1 text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded-lg">
                {recentLogs.length} Events Logged
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-800/70 text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <th className="py-3 px-4">Attacker IP Address</th>
                  <th className="py-3 px-4">Attack Classification</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Target Client</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentLogs.length > 0 ? (
                  recentLogs.map((item, index) => {
                    const ipStr = typeof item === 'object' ? (item.ip || item.ip_address || '127.0.0.1') : String(item);
                    const attackTypeStr = typeof item === 'object' ? (item.attack_type || 'SQL Injection') : 'SQL Injection';
                    const timeStr = typeof item === 'object' ? (item.timestamp || 'Just Now') : 'Just Now';
                    const cidStr = typeof item === 'object' ? (item.client_id || activeClientId) : activeClientId;

                    return (
                      <tr key={`${ipStr}-${index}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-cyan-300">{ipStr}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50 text-[11px]">
                            {attackTypeStr}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{timeStr}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                            {cidStr}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Blocked by WAF</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 italic">
                      No attack logs recorded for Client ID "{activeClientId}". Select or enter another Client ID.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}
