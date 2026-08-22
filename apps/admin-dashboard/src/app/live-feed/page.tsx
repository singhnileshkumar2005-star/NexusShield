'use client';

import React from 'react';
import { ThreatRadar } from '@/components/live-feed/ThreatRadar';
import { LiveEventFeed } from '@/components/live-feed/LiveEventFeed';
import { Badge } from '@/components/ui/Badge';
import { useSSE } from '@/lib/useSSE';

export default function LiveFeedPage() {
  const {
    events,
    isConnected,
    connectionMode,
    isPaused,
    togglePause,
    clearEvents,
    triggerSimulatedAttack,
  } = useSSE(150);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#ffffff] font-display">
              Dedicated Live Threat Stream & Radar
            </h2>
            <Badge variant="black" size="sm" pulse={!isPaused}>
              {isPaused ? 'PAUSED' : 'LIVE STREAM'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#a0a0a0] mt-1">
            Zero-knowledge Server-Sent Events (SSE) telemetry pipeline ingesting live malicious probes across the mesh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#3ecf8e] animate-ping' : 'bg-[#3ecf8e]'
              }`}
            />
            <span className="text-[#ffffff]">
              {connectionMode === 'sse_live' ? 'Hub Live Socket' : 'Autonomous Mesh Simulation'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar on left (or top), Live Stream Log on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ThreatRadar events={events} isPaused={isPaused} />
        </div>
        <div className="lg:col-span-2 min-h-[500px]">
          <LiveEventFeed
            events={events}
            isPaused={isPaused}
            onTogglePause={togglePause}
            onClearEvents={clearEvents}
            onTriggerAttack={() => triggerSimulatedAttack()}
          />
        </div>
      </div>
    </div>
  );
}
