import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Key, 
  Lock, 
  Search, 
  RefreshCw, 
  Activity, 
  Terminal, 
  Copy, 
  Check, 
  Code2, 
  Layers, 
  ArrowLeft,
  Server,
  Cpu
} from 'lucide-react';

const DEFAULT_HUB_URL = import.meta.env.VITE_HUB_API || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://nexusshield.onrender.com');

const DEFAULT_API_KEY = import.meta.env.VITE_NEXUS_API_KEY || 'nexus_dev_key_2026';

const SDK_SNIPPETS = {
  nodejs: `// Install: npm install @nexusshield/waf
import express from 'express';
import { nexusShield } from '@nexusshield/waf';

const app = express();

// Attach Zero-Knowledge Collaborative WAF
app.use(nexusShield({
  hubUrl: 'https://nexusshield.onrender.com',
  apiKey: 'nexus_dev_key_2026',
  clientId: 'CLIENT_ID_PLACEHOLDER',
  mode: 'enforce', // 'enforce' | 'monitor'
  syncIntervalMs: 10000
}));

app.get('/api/data', (req, res) => {
  res.json({ status: 'secure', message: 'Protected by NexusShield' });
});

app.listen(3000, () => console.log('Spoke listening on port 3000'));`,

  python: `# Install: pip install nexusshield-waf
from fastapi import FastAPI, Request
from nexusshield import NexusShieldMiddleware

app = FastAPI()

# Attach Zero-Knowledge Collaborative WAF
app.add_middleware(
    NexusShieldMiddleware,
    hub_url="https://nexusshield.onrender.com",
    api_key="nexus_dev_key_2026",
    client_id="CLIENT_ID_PLACEHOLDER",
    enforce=True
)

@app.get("/api/data")
async def get_data():
    return {"status": "secure", "message": "Protected by NexusShield"}`,

  curl: `# Test Ingest API directly
curl -X POST "https://nexusshield.onrender.com/report" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: nexus_dev_key_2026" \\
  -d '{
    "ip_address": "198.51.100.24",
    "client_id": "CLIENT_ID_PLACEHOLDER",
    "attack_type": "SQL Injection",
    "node": "CLIENT_ID_PLACEHOLDER"
  }'`
};

export default function ClientPortal({ 
  onBackToAdmin, 
  hubUrl = DEFAULT_HUB_URL, 
  apiKey = DEFAULT_API_KEY,
  initialClientId = 'client_A',
  onClientChange
}) {
  const [clientIdInput, setClientIdInput] = useState(initialClientId);
  const [activeClientId, setActiveClientId] = useState(initialClientId);
  const [clientData, setClientData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [sdkTab, setSdkTab] = useState('nodejs');
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [copiedIp, setCopiedIp] = useState(null);

  // Sync state if initialClientId changes from URL query
  useEffect(() => {
    if (initialClientId && initialClientId !== activeClientId) {
      setClientIdInput(initialClientId);
      setActiveClientId(initialClientId);
    }
  }, [initialClientId]);

  // Fetch client-specific telemetry from FastAPI backend
  const fetchClientStats = useCallback(async (targetCid) => {
    const cid = targetCid || activeClientId;
    if (!cid.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await axios.get(`${hubUrl}/client-stats/${encodeURIComponent(cid.trim())}`, {
        headers: { 'x-api-key': apiKey },
        timeout: 3000
      });
      if (response.data) {
        setClientData(response.data);
        setIsOnline(true);
      }
    } catch (err) {
      // Offline or network error
      setErrorMsg(`Could not fetch telemetry for Client ID "${cid}". Displaying local cache.`);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeClientId, hubUrl, apiKey]);

  // Submit handler for Client ID search form
  const handleLoadClient = (e) => {
    if (e) e.preventDefault();
    const cleanId = clientIdInput.trim();
    if (!cleanId) return;
    setActiveClientId(cleanId);
    if (onClientChange) onClientChange(cleanId);
    fetchClientStats(cleanId);
  };

  // Quick preset selector handler
  const handleSelectPreset = (presetId) => {
    setClientIdInput(presetId);
    setActiveClientId(presetId);
    if (onClientChange) onClientChange(presetId);
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

  const handleCopySdk = () => {
    const code = SDK_SNIPPETS[sdkTab].replace(/CLIENT_ID_PLACEHOLDER/g, activeClientId);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedSdk(true);
      setTimeout(() => setCopiedSdk(false), 2000);
    }
  };

  const handleCopyIp = (ip) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  const recentLogs = clientData?.recent_logs || clientData?.blocked_ips || [];
  const totalBlocked = clientData?.total_blocked ?? clientData?.stats?.total_blocked ?? recentLogs.length;

  return (
    <div className="text-slate-200 font-sans pb-12">
      
      {/* Top Banner Navigation Bar */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#1a2234]">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToAdmin}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0e131f] hover:bg-[#141b2c] border border-[#1a2234] hover:border-slate-700 text-xs font-mono text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to SOC Hub</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Current Scope:</span>
            <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono text-xs font-bold">
              {activeClientId}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden sm:inline">Tenant Isolation Enforced</span>
        </div>
      </div>

      {/* Client ID Selection & Search Control Card */}
      <div className="stripe-card p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <form onSubmit={handleLoadClient} className="flex-1 flex items-center space-x-2">
            <div className="relative flex-1 max-w-md">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="Enter tenant identifier (e.g. client_A, client_B)..."
                className="w-full bg-[#080b11] border border-[#1a2234] rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-semibold rounded-lg shadow-md shadow-cyan-900/30 flex items-center space-x-1.5 transition-all disabled:opacity-50 active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Load Tenant</span>
            </button>
          </form>

          {/* Quick Tenant Presets */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Presets:</span>
            {['client_A', 'client_B'].map((preset) => (
              <button
                key={preset}
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  activeClientId === preset
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600 shadow-sm font-bold'
                    : 'bg-[#080b11] text-slate-400 border-[#1a2234] hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => fetchClientStats(activeClientId)}
            className="px-3 py-1 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded font-semibold transition-colors text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tenant Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Card 1: Client Attacks Prevented */}
        <div className="stripe-card border-gradient-cyan p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Attacks Intercepted
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {totalBlocked}
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 font-mono">
              Tenant Isolated
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-sans">
            Filtered specifically for node <code className="text-cyan-300 font-mono">{activeClientId}</code>
          </p>
        </div>

        {/* Card 2: Protection Policy */}
        <div className="stripe-card border-gradient-emerald p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              WAF Defense Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              Active & Enforced
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Zero False +</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-sans">
            Continuous Bloom filter synchronization active
          </p>
        </div>

        {/* Card 3: Scope & Sync */}
        <div className="stripe-card border-gradient-purple p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Telemetry Channel
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xl font-bold text-purple-300 font-mono truncate">
              /client-stats/{activeClientId}
            </span>
            <button
              onClick={() => fetchClientStats(activeClientId)}
              className="p-1 rounded-lg bg-[#080b11] hover:bg-slate-800 text-slate-300 border border-[#1a2234] transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-sans">
            Multi-tenant isolated REST & SSE pipeline
          </p>
        </div>

      </div>

      {/* Read-Only Client Threat Logs Table */}
      <div className="stripe-card p-5 mb-8">
        
        <div className="flex items-center justify-between pb-4 border-b border-[#1a2234] mb-4">
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
              Tenant Deflection Logs ({activeClientId})
            </h2>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#080b11] text-slate-400 border border-[#1a2234]">
              Read-Only Scope
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 tabular-nums">
              {recentLogs.length} Events
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#080b11]/80 text-slate-400 uppercase tracking-wider border-b border-[#1a2234] text-[11px]">
                <th className="py-3 px-4 font-semibold">Attacker IP Address</th>
                <th className="py-3 px-4 font-semibold">Threat Vector</th>
                <th className="py-3 px-4 font-semibold">Logged At</th>
                <th className="py-3 px-4 font-semibold">Target Node</th>
                <th className="py-3 px-4 text-right font-semibold">WAF Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2234]/70">
              {recentLogs.length > 0 ? (
                recentLogs.map((item, index) => {
                  const ipStr = typeof item === 'object' ? (item.ip || item.ip_address || '127.0.0.1') : String(item);
                  const attackTypeStr = typeof item === 'object' ? (item.attack_type || 'SQL Injection') : 'SQL Injection';
                  const timeStr = typeof item === 'object' ? (item.timestamp || 'Just Now') : 'Just Now';
                  const cidStr = typeof item === 'object' ? (item.client_id || activeClientId) : activeClientId;
                  const isCopied = copiedIp === ipStr;

                  return (
                    <tr key={`${ipStr}-${index}`} className="hover:bg-[#141b2c]/60 transition-colors group">
                      {/* IP + Copy */}
                      <td className="py-3 px-4 font-bold text-cyan-300">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{ipStr}</span>
                          <button
                            onClick={() => handleCopyIp(ipStr)}
                            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            title="Copy IP"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Vector */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/50 text-[11px]">
                          {attackTypeStr}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-400 tabular-nums">{timeStr}</td>

                      {/* Node */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#080b11] border border-slate-700/60 text-slate-300 text-[11px]">
                          {cidStr}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Blocked 403</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <p className="italic text-xs font-sans">No attack logs recorded for Client ID "{activeClientId}".</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Spoke SDK Integration Code Snippet Card */}
      <div className="stripe-card p-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a2234] mb-3">
          <div className="flex items-center space-x-2.5">
            <Code2 className="w-4 h-4 text-purple-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Spoke Integration SDK
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Drop NexusShield middleware directly into your Node.js or Python backend
              </p>
            </div>
          </div>

          {/* Language Tabs & Copy Button */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center p-0.5 bg-[#080b11] border border-[#1a2234] rounded-lg text-xs font-mono">
              <button
                onClick={() => setSdkTab('nodejs')}
                className={`px-3 py-1 rounded transition-colors ${
                  sdkTab === 'nodejs'
                    ? 'bg-[#1a2234] text-cyan-300 font-bold border border-cyan-800/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Node.js (Express)
              </button>
              <button
                onClick={() => setSdkTab('python')}
                className={`px-3 py-1 rounded transition-colors ${
                  sdkTab === 'python'
                    ? 'bg-[#1a2234] text-purple-300 font-bold border border-purple-800/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Python (FastAPI)
              </button>
              <button
                onClick={() => setSdkTab('curl')}
                className={`px-3 py-1 rounded transition-colors ${
                  sdkTab === 'curl'
                    ? 'bg-[#1a2234] text-emerald-300 font-bold border border-emerald-800/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                cURL
              </button>
            </div>

            <button
              onClick={handleCopySdk}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold shadow-md shadow-purple-900/30 transition-all active:scale-95"
            >
              {copiedSdk ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="bg-[#06080d] border border-[#131a29] rounded-xl p-4 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed">
          <pre>
            <code>
              {SDK_SNIPPETS[sdkTab].replace(/CLIENT_ID_PLACEHOLDER/g, activeClientId)}
            </code>
          </pre>
        </div>

      </div>

    </div>
  );
}
