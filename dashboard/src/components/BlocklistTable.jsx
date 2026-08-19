import React, { useState } from 'react';
import { 
  Search, 
  ShieldX, 
  UserCheck, 
  Lock, 
  RefreshCw, 
  Copy, 
  Check, 
  Globe, 
  Clock, 
  ExternalLink,
  Filter
} from 'lucide-react';

const getVectorBadgeStyle = (attackType = '') => {
  const type = String(attackType).toLowerCase();
  if (type.includes('sql')) {
    return 'bg-rose-950/60 text-rose-300 border-rose-800/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]';
  } else if (type.includes('xss') || type.includes('script')) {
    return 'bg-amber-950/60 text-amber-300 border-amber-800/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
  } else if (type.includes('path') || type.includes('traversal')) {
    return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]';
  } else if (type.includes('brute') || type.includes('flood') || type.includes('dos')) {
    return 'bg-purple-950/60 text-purple-300 border-purple-800/50 shadow-[0_0_10px_rgba(139,92,246,0.1)]';
  }
  return 'bg-slate-800/80 text-slate-300 border-slate-700/60';
};

export default function BlocklistTable({ blocklist, onUnban, isUnbanningIp }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [copiedIp, setCopiedIp] = useState(null);

  const handleCopy = (ip) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  // Filter blocklist based on search term and category
  const filteredList = (blocklist || []).filter((item) => {
    const ip = typeof item === 'object' ? item.ip : item;
    const attackType = typeof item === 'object' ? (item.attack_type || 'SQL Injection') : 'SQL Injection';
    const node = typeof item === 'object' ? (item.node || item.client_id || 'Site-A') : 'Site-A';
    
    const query = searchTerm.toLowerCase();
    const matchesQuery = (
      ip.toLowerCase().includes(query) ||
      attackType.toLowerCase().includes(query) ||
      node.toLowerCase().includes(query)
    );

    if (!matchesQuery) return false;

    if (selectedFilter === 'SQLi') return attackType.toLowerCase().includes('sql');
    if (selectedFilter === 'XSS') return attackType.toLowerCase().includes('xss') || attackType.toLowerCase().includes('script');
    if (selectedFilter === 'Path') return attackType.toLowerCase().includes('path') || attackType.toLowerCase().includes('traversal');
    
    return true;
  });

  return (
    <div className="stripe-card p-5 mb-6">
      
      {/* Table Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1a2234] mb-4">
        
        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldX className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Global Blocklist Registry
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/60 rounded-full tabular-nums">
                {filteredList.length} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">Enforced across all spoke nodes via zero-knowledge Bloom filters</p>
          </div>
        </div>

        {/* Search & Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Filter Pills */}
          <div className="flex items-center p-0.5 bg-[#080b11] border border-[#1a2234] rounded-lg text-[10px] font-mono">
            {['ALL', 'SQLi', 'XSS', 'Path'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedFilter(category)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedFilter === category 
                    ? 'bg-[#1a2234] text-white font-bold border border-slate-700/60 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter IP or Vector..."
              className="w-full bg-[#080b11] border border-[#1a2234] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-colors font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono"
              >
                ×
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Table Component */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-[#080b11]/80 text-slate-400 border-b border-[#1a2234] uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-semibold">Attacker IP Address</th>
              <th className="py-3 px-4 font-semibold">Threat Vector</th>
              <th className="py-3 px-4 font-semibold">Origin Node</th>
              <th className="py-3 px-4 font-semibold">Timestamp</th>
              <th className="py-3 px-4 font-semibold">WAF Enforcement</th>
              <th className="py-3 px-4 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2234]/70">
            {filteredList.length > 0 ? (
              filteredList.map((item, idx) => {
                const ip = typeof item === 'object' ? item.ip : item;
                const attackType = typeof item === 'object' ? (item.attack_type || 'SQL Injection') : 'SQL Injection';
                const timestamp = typeof item === 'object' ? (item.timestamp || '2026-08-18 01:30:00') : 'Just Now';
                const node = typeof item === 'object' ? (item.node || item.client_id || 'Site-A') : 'Site-A';
                const isProcessing = isUnbanningIp === ip;
                const isCopied = copiedIp === ip;

                return (
                  <tr 
                    key={`${ip}-${idx}`}
                    className="hover:bg-[#141b2c]/60 transition-colors group"
                  >
                    {/* Attacker IP + 1-Click Copy */}
                    <td className="py-3 px-4 font-bold text-slate-100">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-mono text-cyan-300">{ip}</span>
                        <button
                          onClick={() => handleCopy(ip)}
                          className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Copy IP Address"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Attack Vector */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getVectorBadgeStyle(attackType)}`}>
                        {attackType}
                      </span>
                    </td>

                    {/* Node */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#080b11] text-cyan-300 border border-slate-700/60 text-[11px]">
                        {node}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] tabular-nums">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{timestamp}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-800/60 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                        <span>Globally Blocked</span>
                      </span>
                    </td>

                    {/* Actions: Unban / Revoke */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onUnban(ip)}
                        disabled={isProcessing}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 border border-emerald-800/60 hover:border-emerald-700 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                            <span>Revoking...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
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
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Globe className="w-6 h-6 text-slate-600" />
                    <p className="italic text-xs font-sans">No blocked IPs found matching "{searchTerm || selectedFilter}".</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="pt-3 border-t border-[#1a2234] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-sans gap-2">
        <span>Showing {filteredList.length} of {blocklist?.length || 0} globally blocked IP addresses</span>
        <span className="font-mono text-[10px] text-slate-400">Zero-Knowledge Peer Sync Active</span>
      </div>

    </div>
  );
}

