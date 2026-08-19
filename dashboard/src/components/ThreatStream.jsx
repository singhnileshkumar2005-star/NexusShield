import React, { useRef, useEffect } from 'react';
import { Terminal, ShieldAlert, CheckCircle, Radio } from 'lucide-react';

export default function ThreatStream({ events }) {
  const scrollRef = useRef(null);

  // Auto-scroll to top or bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  return (
    <div className="cyber-card rounded-xl border border-slate-800 p-4 mb-6 flex flex-col h-[340px]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Real-Time Threat Stream (Live Event Log)
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span className="text-xs font-mono text-slate-400">Live SSE Stream</span>
        </div>
      </div>

      {/* Terminal Stream Container */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 bg-[#080c14] p-3 rounded-lg border border-slate-900 shadow-inner"
      >
        {events && events.length > 0 ? (
          events.map((evt) => {
            const isUnban = evt.attack_type === 'Revoked / Unbanned';
            return (
              <div 
                key={evt.id || `${evt.ip}-${evt.timestamp}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  {isUnban ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}

                  <span className="text-slate-500 font-mono text-[11px]">{evt.timestamp}</span>

                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] border border-slate-700">
                    [{evt.node || 'Node-A'}]
                  </span>

                  <span className="text-slate-200 font-semibold">{evt.ip}</span>
                </div>

                <div className="mt-1 sm:mt-0 flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isUnban
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                      : 'bg-rose-950/70 text-rose-300 border-rose-800/60'
                  }`}>
                    {evt.attack_type}
                  </span>
                  
                  <span className="text-slate-400 text-[11px]">
                    {isUnban ? 'Unbanned' : 'BLOCKED 403'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 italic">
            Waiting for threat events... (Run Attack Simulator to trigger alerts)
          </div>
        )}
      </div>

    </div>
  );
}
