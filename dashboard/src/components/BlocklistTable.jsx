import React, { useState } from 'react';
import { Search, ShieldX, UserCheck, Lock, RefreshCw } from 'lucide-react';

export default function BlocklistTable({ blocklist, onUnban, isUnbanningIp }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter blocklist based on search term
  const filteredList = (blocklist || []).filter((item) => {
    const ip = typeof item === 'object' ? item.ip : item;
    const attackType = typeof item === 'object' ? item.attack_type : 'SQL Injection';
    const node = typeof item === 'object' ? item.node : 'Site-A';
    
    const query = searchTerm.toLowerCase();
    return (
      ip.toLowerCase().includes(query) ||
      attackType.toLowerCase().includes(query) ||
      node.toLowerCase().includes(query)
    );
  });

  return (
    <div className="cyber-card rounded-xl border border-slate-800 p-4 mb-6">
      
      {/* Table Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <ShieldX className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            Global Blocklist Management Table
          </h3>
          <span className="px-2 py-0.5 text-xs font-mono bg-rose-950/60 text-rose-300 border border-rose-800/60 rounded-full">
            {filteredList.length} Entries
          </span>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search IP or Attack..."
            className="w-full bg-[#080c14] border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
          />
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <th className="py-3 px-4">Attacker IP</th>
              <th className="py-3 px-4">Attack Vector</th>
              <th className="py-3 px-4">Detected At</th>
              <th className="py-3 px-4">Origin Node</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredList.length > 0 ? (
              filteredList.map((item, idx) => {
                const ip = typeof item === 'object' ? item.ip : item;
                const attackType = typeof item === 'object' ? (item.attack_type || 'SQL Injection') : 'SQL Injection';
                const timestamp = typeof item === 'object' ? (item.timestamp || '2026-08-18 01:30:00') : 'Just Now';
                const node = typeof item === 'object' ? (item.node || 'Site-A') : 'Site-A';
                const isProcessing = isUnbanningIp === ip;

                return (
                  <tr 
                    key={`${ip}-${idx}`}
                    className="hover:bg-slate-900/50 transition-colors group"
                  >
                    {/* Attacker IP */}
                    <td className="py-3 px-4 font-bold text-slate-100 flex items-center space-x-2">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      <span>{ip}</span>
                    </td>

                    {/* Attack Vector */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[11px]">
                        {attackType}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-400">{timestamp}</td>

                    {/* Node */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 text-[11px]">
                        {node}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span>Globally Blocked</span>
                      </span>
                    </td>

                    {/* Actions: Unban */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onUnban(ip)}
                        disabled={isProcessing}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 border border-emerald-800/60 rounded text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Revoking...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Unban / Revoke</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                  No blocked IPs found matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
