'use client';

import React from 'react';
import Link from 'next/link';
import { useSite } from '@/lib/site-context';
import { ShieldCheck, Zap, Radio, ArrowUpRight, Lock, Activity } from 'lucide-react';

export function StatusBanner() {
  const { selectedSite, isPinging, pingCurrentAgent } = useSite();

  return (
    <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 sm:p-6 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side: Status badge & site metadata */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#000000] text-[#ffffff] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#ffffff]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[#171717] tracking-tight">
                {selectedSite.site_name}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fafafa] border border-[#ebebeb] text-[#171717]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#171717] animate-pulse" />
                Active Mesh Protection
              </span>
              <span className="text-xs text-[#8f8f8f] font-mono hidden md:inline">
                {selectedSite.site_url}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1 text-xs text-[#4d4d4d]">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#171717]" />
                In-Memory Cache (<span className="font-mono text-[#171717]">{selectedSite.agent_latency_ms}</span> latency)
              </span>
              <span className="hidden sm:inline text-[#ebebeb]">•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#171717]" />
                Sovereign Privacy Guaranteed (Zero Payload Disclosure)
              </span>
              <span className="hidden sm:inline text-[#ebebeb]">•</span>
              <span className="flex items-center gap-1 font-mono text-[#8f8f8f]">
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
            className="px-3.5 py-1.5 bg-[#ffffff] hover:bg-[#fafafa] border border-[#ebebeb] rounded-full text-xs font-medium text-[#171717] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 text-[#171717] ${isPinging ? 'animate-pulse' : ''}`} />
            <span>{isPinging ? 'Pinging Node...' : 'Test Connection'}</span>
          </button>

          <Link
            href="/setup"
            className="px-4 py-1.5 bg-[#000000] hover:bg-[#171717] text-[#ffffff] rounded-full text-xs font-medium transition-colors flex items-center gap-1"
          >
            <span>Agent Setup</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
