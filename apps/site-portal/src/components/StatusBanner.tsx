'use client';

import React from 'react';
import Link from 'next/link';
import { useSite } from '@/lib/site-context';
import { ShieldCheck, Zap, Radio, ArrowUpRight, Lock } from 'lucide-react';

export function StatusBanner() {
  const { selectedSite, isPinging, pingCurrentAgent } = useSite();

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 transition-all shadow-card-subtle">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side: Status badge & site metadata */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#006239] border border-[#3ecf8e]/30 text-[#3ecf8e] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#3ecf8e]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[#ffffff] font-display tracking-tight">
                {selectedSite.site_name}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#006239]/40 border border-[#3ecf8e]/40 text-[#3ecf8e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e] animate-pulse" />
                Active Mesh Protection
              </span>
              <span className="text-xs text-[#a0a0a0] font-mono hidden md:inline">
                {selectedSite.site_url}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1 text-xs text-[#a0a0a0]">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#3ecf8e]" />
                In-Memory Cache (<span className="font-mono text-[#3ecf8e]">{selectedSite.agent_latency_ms}</span> latency)
              </span>
              <span className="hidden sm:inline text-[#2e2e2e]">•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#3ecf8e]" />
                Sovereign Privacy Guaranteed (Zero Payload Disclosure)
              </span>
              <span className="hidden sm:inline text-[#2e2e2e]">•</span>
              <span className="flex items-center gap-1 font-mono text-[#a0a0a0]">
                Heartbeat: Active
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2 pt-2 lg:pt-0">
          <button
            onClick={() => pingCurrentAgent()}
            disabled={isPinging}
            className="px-3.5 py-1.5 bg-[#141414] hover:bg-[#222222] border border-[#2e2e2e] rounded-lg text-xs font-medium text-[#ffffff] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 text-[#3ecf8e] ${isPinging ? 'animate-pulse' : ''}`} />
            <span>{isPinging ? 'Pinging Node...' : 'Test Connection'}</span>
          </button>

          <Link
            href="/setup"
            className="px-4 py-1.5 bg-[#3ecf8e] hover:bg-[#3fcf8e] text-[#000000] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <span>Agent Setup</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
