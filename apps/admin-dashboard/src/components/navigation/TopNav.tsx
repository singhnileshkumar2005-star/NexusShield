'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { HubApi } from '@/lib/api';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Operations Center',
    subtitle: 'Real-time collaborative defense telemetry across connected member fleet',
  },
  '/blocklist': {
    title: 'Global Blocklist Inspector',
    subtitle: 'Autonomous distributed IP reputation and IoC enforcement directory',
  },
  '/members': {
    title: 'Member Fleet & Nodes',
    subtitle: 'Registered protected websites, telemetry agents, and node reputation scores',
  },
  '/live-feed': {
    title: 'Live Threat Stream & Radar',
    subtitle: 'Real-time SSE event pipeline broadcasting threat signatures network-wide',
  },
  '/settings': {
    title: 'Mesh Policy & Tuning',
    subtitle: 'Corroboration thresholds, TTL duration, and coordinator hub configuration',
  },
};

export function TopNav() {
  const pathname = usePathname();
  const [hubStatus, setHubStatus] = useState<'checking' | 'connected' | 'simulated'>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentMeta = PAGE_TITLES[pathname] || {
    title: 'Operations Center',
    subtitle: 'NexusSecure Collaborative Defense Mesh',
  };

  const checkStatus = async () => {
    setIsRefreshing(true);
    const health = await HubApi.getHealth();
    if (health.status === 'connected') {
      setHubStatus('connected');
    } else {
      setHubStatus('simulated');
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-[#262626] bg-[#000000]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex flex-col">
        <h1 className="text-sm font-semibold text-[#ffffff] font-display tracking-tight">
          {currentMeta.title}
        </h1>
        <p className="text-xs text-[#a0a0a0] hidden sm:block">
          {currentMeta.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Hub Connection Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#141414] border border-[#2e2e2e] text-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hubStatus === 'connected' ? 'bg-[#3ecf8e]' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                hubStatus === 'connected' ? 'bg-[#3ecf8e]' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="font-mono text-[11px] text-[#ffffff]">
            {hubStatus === 'connected' ? 'Hub: Connected (:3000)' : 'Hub: Autonomous Mesh'}
          </span>
        </div>

        {/* Sync / Refresh Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={checkStatus}
          loading={isRefreshing}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
        >
          Sync
        </Button>
      </div>
    </header>
  );
}
