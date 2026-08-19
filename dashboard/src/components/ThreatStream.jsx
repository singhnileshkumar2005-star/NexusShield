import React, { useRef, useEffect, useState } from 'react';
import { 
  Terminal, 
  ShieldAlert, 
  CheckCircle, 
  Radio, 
  Pause, 
  Play, 
  Trash2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

const getThreatHighlight = (type = '') => {
  const t = String(type).toLowerCase();
  if (t.includes('sql')) {
    return {
      text: 'text-rose-400',
      badge: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
      action: '403 BLOCKED'
    };
  } else if (t.includes('xss') || t.includes('script')) {
    return {
      text: 'text-amber-400',
      badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
      action: '403 BLOCKED'
    };
  } else if (t.includes('path') || t.includes('traversal')) {
    return {
      text: 'text-cyan-400',
      badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
      action: '403 BLOCKED'
    };
  } else if (t.includes('unban') || t.includes('revoke')) {
    return {
      text: 'text-emerald-400',
      badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
      action: 'REVOKED'
    };
  }
  return {
    text: 'text-purple-400',
    badge: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
    action: '403 BLOCKED'
  };
};

export default function ThreatStream({ events }) {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [clearedBefore, setClearedBefore] = useState(0);

  // Auto-scroll when new events arrive unless user paused
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events, isPaused]);

  const visibleEvents = (events || []).filter((e) => {
    const eventTime = e.id || 0;
    return typeof eventTime === 'number' ? eventTime >= clearedBefore : true;
  });

  return (
    <div className="stripe-card p-5 mb-6 flex flex-col h-[380px]">
      
      {/* Terminal Window Header Chrome */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1a2234] mb-3">
        
        {/* Left: Window Control Dots + Title */}
        <div className="flex items-center space-x-3">
          {/* Mac-style Window Controls */}
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#f43f5e]/80 border border-[#f43f5e]"></span>
            <span className="w-3 h-3 rounded-full bg-[#f59e0b]/80 border border-[#f59e0b]"></span>
            <span className="w-3 h-3 rounded-full bg-[#10b981]/80 border border-[#10b981]"></span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
              Live Threat Stream
            </h2>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              --protocol=sse --stream=live
            </span>
          </div>
        </div>

        {/* Right: Live Pulse & Stream Controls */}
        <div className="flex items-center space-x-2">
          
          {/* Live Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-950/40 text-rose-300 border border-rose-800/40 text-[10px] font-mono">
            <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
            <span className="hidden sm:inline font-semibold">SSE Ingest</span>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
              isPaused 
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' 
                : 'bg-[#080b11] text-slate-400 border-[#1a2234] hover:text-white'
            }`}
            title={isPaused ? "Resume Live Stream" : "Pause Auto-scroll"}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Clear Button */}
          <button
            onClick={() => setClearedBefore(Date.now())}
            className="p-1.5 rounded-lg bg-[#080b11] border border-[#1a2234] text-slate-400 hover:text-white transition-colors"
            title="Clear Stream History"
          >
            <Trash2 className="w-3 h-3" />
          </button>

        </div>

      </div>

      {/* Terminal Output Window */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-2 bg-[#06080d] p-3.5 rounded-xl border border-[#131a29] shadow-inner"
      >
        {visibleEvents.length > 0 ? (
          visibleEvents.map((evt, idx) => {
            const isUnban = evt.attack_type === 'Revoked / Unbanned';
            const styling = getThreatHighlight(evt.attack_type);

            return (
              <div 
                key={evt.id || `${evt.ip}-${evt.timestamp}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#0c101a]/80 border border-[#1a2234] hover:border-slate-700 transition-colors group"
              >
                {/* Left Event Details */}
                <div className="flex items-center space-x-2.5 flex-wrap">
                  {isUnban ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}

                  {/* Timestamp */}
                  <span className="text-slate-500 text-[11px] tabular-nums">
                    [{evt.timestamp || '00:00:00'}]
                  </span>

                  {/* Node Badge */}
                  <span className="px-1.5 py-0.2 rounded bg-[#141b2c] text-cyan-300 text-[10px] border border-cyan-800/40">
                    {evt.node || 'Site-A'}
                  </span>

                  {/* IP Address */}
                  <span className="text-white font-semibold group-hover:text-cyan-300 transition-colors">
                    {evt.ip}
                  </span>

                  {/* Threat Description */}
                  <span className="text-slate-400 text-[11px] hidden md:inline">
                    intercepted vector &rarr;
                  </span>
                </div>

                {/* Right Status Badges */}
                <div className="mt-1 sm:mt-0 flex items-center space-x-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${styling.badge}`}>
                    {evt.attack_type}
                  </span>
                  
                  <span className="px-2 py-0.5 rounded bg-[#1a2234] text-slate-300 text-[10px] font-bold border border-slate-700">
                    {styling.action}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400">&gt;</span>
              <span className="italic">Listening for incoming threat telemetry...</span>
              <span className="w-2 h-4 bg-cyan-400 inline-block animate-pulse"></span>
            </div>
            <span className="text-[11px] text-slate-600 font-sans">
              (Use the Attack Simulator to inject live attack payloads)
            </span>
          </div>
        )}
      </div>

    </div>
  );
}

