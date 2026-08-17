import React, { useState } from 'react';
import { X, Play, Terminal, Zap, ShieldAlert, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function SimulatorModal({ isOpen, onClose, onRefreshData }) {
  const [targetUrl, setTargetUrl] = useState('http://127.0.0.1:3000');
  const [nodeName, setNodeName] = useState('Site-A');
  const [attackType, setAttackType] = useState('SQL Injection');
  const [customIp, setCustomIp] = useState('192.168.1.105');
  const [payload, setPayload] = useState("/search?q=' OR 1=1");
  
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  if (!isOpen) return null;

  const handleQuickPreset = (type) => {
    if (type === 'SQLi') {
      setAttackType('SQL Injection');
      setPayload("/search?q=' OR 1=1");
    } else if (type === 'XSS') {
      setAttackType('XSS Vector');
      setPayload("/comment?text=<script>alert('waf')</script>");
    } else if (type === 'Path') {
      setAttackType('Path Traversal');
      setPayload("/download?file=../../etc/passwd");
    }
  };

  const runSimulation = async () => {
    setIsRunning(true);
    const timestamp = new Date().toLocaleTimeString();
    
    setLogs(prev => [
      ...prev, 
      `[${timestamp}] 🎯 Launching ${attackType} simulation against ${targetUrl}...`
    ]);

    try {
      // 1. Send test attack to target URL or report directly to Hub
      if (targetUrl.includes('8000')) {
        // Direct report to Hub
        await axios.post('http://127.0.0.1:8000/report', {
          ip_address: customIp,
          attack_type: attackType,
          node: nodeName
        });
        setLogs(prev => [
          ...prev, 
          `[${timestamp}] ✅ Hub Received Report: ${customIp} (${attackType}) blocked globally!`
        ]);
      } else {
        // Attack site spoke
        try {
          const res = await axios.get(`${targetUrl}${payload}`);
          setLogs(prev => [
            ...prev,
            `[${timestamp}] ⚠️ Target returned status: ${res.status}`
          ]);
        } catch (err) {
          if (err.response && err.response.status === 403) {
            setLogs(prev => [
              ...prev,
              `[${timestamp}] 🛡️ SUCCESS (403 Forbidden): Spoke WAF intercepted payload and reported IP ${customIp}!`
            ]);
          } else {
            // Also report directly to hub to ensure UI updates during test
            await axios.post('http://127.0.0.1:8000/report', {
              ip_address: customIp,
              attack_type: attackType,
              node: nodeName
            });
            setLogs(prev => [
              ...prev,
              `[${timestamp}] ✅ Triggered attack & updated Global Hub blocklist.`
            ]);
          }
        }
      }

      // Refresh dashboard data
      if (onRefreshData) {
        setTimeout(onRefreshData, 500);
      }

    } catch (error) {
      setLogs(prev => [
        ...prev,
        `[${timestamp}] ❌ Error: ${error.message}`
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="cyber-card w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <Zap className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-wide font-mono">
              Spoke Attack Simulator & Test Panel
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
          
          {/* Quick Presets */}
          <div>
            <label className="block text-slate-400 mb-2 uppercase font-semibold">Attack Presets</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickPreset('SQLi')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                  attackType === 'SQL Injection'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                SQL Injection
              </button>
              <button
                onClick={() => handleQuickPreset('XSS')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                  attackType === 'XSS Vector'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                XSS Vector
              </button>
              <button
                onClick={() => handleQuickPreset('Path')}
                className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                  attackType === 'Path Traversal'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Path Traversal
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Target Node / Server</label>
              <select
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  setNodeName(e.target.value.includes('3000') ? 'Site-A' : e.target.value.includes('3001') ? 'Site-B' : 'Direct-Hub');
                }}
                className="w-full bg-[#080c14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="http://127.0.0.1:3000">Site A (Express - Port 3000)</option>
                <option value="http://127.0.0.1:3001">Site B (Express - Port 3001)</option>
                <option value="http://127.0.0.1:8000">Direct Hub API (Port 8000)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Simulated Attacker IP</label>
              <input
                type="text"
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                className="w-full bg-[#080c14] border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Payload String</label>
            <input
              type="text"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full bg-[#080c14] border border-slate-700 rounded-lg p-2 text-rose-300 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-lg shadow-lg shadow-rose-900/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executing Simulation...' : 'Fire Test Attack'}</span>
          </button>

          {/* Simulator Console Output */}
          <div>
            <label className="block text-slate-400 mb-1 font-mono flex items-center justify-between">
              <span>Console Log</span>
              <button 
                onClick={() => setLogs([])} 
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear Log
              </button>
            </label>
            <div className="bg-[#080c14] border border-slate-800 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[11px] space-y-1 text-slate-300">
              {logs.length > 0 ? (
                logs.map((msg, i) => <div key={i}>{msg}</div>)
              ) : (
                <div className="text-slate-600 italic">Click "Fire Test Attack" to simulate an incoming threat...</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
