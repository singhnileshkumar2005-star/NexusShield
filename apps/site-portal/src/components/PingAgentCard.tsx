'use client';

import React, { useState } from 'react';
import { useSite } from '@/lib/site-context';
import { Radio, CheckCircle2, RefreshCw, Terminal, Zap, ShieldCheck, Copy, Check } from 'lucide-react';

export function PingAgentCard() {
  const { selectedSite, isPinging, pingCurrentAgent, lastPingResult, addToast } = useSite();
  const [curlCopied, setCurlCopied] = useState(false);

  const testCurlCommand = `curl -X POST "${process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:3000'}/v1/heartbeat" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${selectedSite.api_key_full}" \\
  -d '{"site_id": "${selectedSite.id}", "ping": true}'`;

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(testCurlCommand);
      setCurlCopied(true);
      addToast({
        type: 'info',
        title: 'Curl Command Copied',
        description: 'Run this command in terminal to test direct Hub connectivity.',
      });
      setTimeout(() => setCurlCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-[#ebebeb]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
            <Radio className="w-5 h-5 text-[#171717]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#171717] tracking-tight">
              Live Mesh Agent Health & Ping Diagnostic
            </h3>
            <p className="text-xs text-[#8f8f8f] mt-0.5">
              Verify that your site&apos;s security agent middleware is actively synchronized with the NexusSecure hub.
            </p>
          </div>
        </div>

        <button
          onClick={() => pingCurrentAgent()}
          disabled={isPinging}
          className="px-5 py-2 bg-[#000000] hover:bg-[#171717] text-[#ffffff] rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>{isPinging ? 'Pinging Hub Mesh...' : 'Ping Node Agent'}</span>
        </button>
      </div>

      {/* Ping Results Display */}
      {lastPingResult ? (
        <div className="mt-5 bg-[#fafafa] border border-[#ebebeb] rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#171717] mb-3">
            <CheckCircle2 className="w-4 h-4 text-[#171717]" />
            <span>Agent Handshake Verified & Synchronized</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#ffffff] border border-[#ebebeb] rounded-md p-3">
              <span className="text-[10px] text-[#8f8f8f] uppercase tracking-wider font-medium">
                Round-Trip Latency
              </span>
              <div className="text-lg font-mono font-semibold text-[#171717] mt-1">
                {lastPingResult.latencyMs} ms
              </div>
            </div>

            <div className="bg-[#ffffff] border border-[#ebebeb] rounded-md p-3">
              <span className="text-[10px] text-[#8f8f8f] uppercase tracking-wider font-medium">
                Agent Version
              </span>
              <div className="text-xs font-mono font-semibold text-[#171717] mt-1.5">
                {lastPingResult.agentVersion}
              </div>
            </div>

            <div className="bg-[#ffffff] border border-[#ebebeb] rounded-md p-3">
              <span className="text-[10px] text-[#8f8f8f] uppercase tracking-wider font-medium">
                Active Mesh Peers
              </span>
              <div className="text-lg font-mono font-semibold text-[#171717] mt-1">
                {lastPingResult.meshPeers}
              </div>
            </div>

            <div className="bg-[#ffffff] border border-[#ebebeb] rounded-md p-3">
              <span className="text-[10px] text-[#8f8f8f] uppercase tracking-wider font-medium">
                Sync Status
              </span>
              <div className="text-xs font-semibold text-[#171717] mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#171717]" />
                <span>Synchronized</span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-[#4d4d4d] font-mono">
            {lastPingResult.message}
          </div>
        </div>
      ) : (
        <div className="mt-5 bg-[#fafafa] border border-[#ebebeb] rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-[#4d4d4d]">
            <ShieldCheck className="w-4 h-4 text-[#171717]" />
            <span>Click &apos;Ping Node Agent&apos; above to initiate a live telemetry handshake test.</span>
          </div>
          <span className="text-xs font-mono text-[#8f8f8f] hidden sm:inline">
            Target: {selectedSite.site_name}
          </span>
        </div>
      )}

      {/* Terminal Curl Diagnostic */}
      <div className="mt-5 pt-5 border-t border-[#ebebeb]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#4d4d4d]">
            <Terminal className="w-3.5 h-3.5 text-[#171717]" />
            <span>CLI Diagnostic Test</span>
          </div>
          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1 text-[11px] text-[#171717] hover:text-[#4d4d4d] font-medium transition-colors"
          >
            {curlCopied ? <Check className="w-3 h-3 text-[#171717]" /> : <Copy className="w-3 h-3" />}
            <span>{curlCopied ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>

        <div className="bg-[#171717] border border-[#2e2e2e] rounded-md p-3 overflow-x-auto font-mono text-[11px] text-[#e0e0e0] leading-relaxed">
          <code>{testCurlCommand}</code>
        </div>
      </div>
    </div>
  );
}
