'use client';

import React, { useState } from 'react';
import { useSite } from '@/lib/site-context';
import { Radio, CheckCircle2, RefreshCw, Terminal, ShieldCheck, Copy, Check } from 'lucide-react';

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
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-6 shadow-card-subtle">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-[#262626]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center flex-shrink-0">
            <Radio className="w-5 h-5 text-[#3ecf8e]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#ffffff] font-display tracking-tight">
              Live Mesh Agent Health & Ping Diagnostic
            </h3>
            <p className="text-xs text-[#a0a0a0] mt-0.5">
              Verify that your site&apos;s security agent middleware is actively synchronized with the NexusSecure hub.
            </p>
          </div>
        </div>

        <button
          onClick={() => pingCurrentAgent()}
          disabled={isPinging}
          className="px-5 py-2 bg-[#3ecf8e] hover:bg-[#3fcf8e] text-[#000000] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 self-start md:self-auto disabled:opacity-50 shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>{isPinging ? 'Pinging Hub Mesh...' : 'Ping Node Agent'}</span>
        </button>
      </div>

      {/* Ping Results Display */}
      {lastPingResult ? (
        <div className="mt-5 bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#3ecf8e] mb-3">
            <CheckCircle2 className="w-4 h-4 text-[#3ecf8e]" />
            <span>Agent Handshake Verified & Synchronized</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-3">
              <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider font-mono">
                Round-Trip Latency
              </span>
              <div className="text-lg font-mono font-semibold text-[#3ecf8e] mt-1">
                {lastPingResult.latencyMs} ms
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-3">
              <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider font-mono">
                Agent Version
              </span>
              <div className="text-xs font-mono font-semibold text-[#ffffff] mt-1.5">
                {lastPingResult.agentVersion}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-3">
              <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider font-mono">
                Active Mesh Peers
              </span>
              <div className="text-lg font-mono font-semibold text-[#3ecf8e] mt-1">
                {lastPingResult.meshPeers}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-3">
              <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider font-mono">
                Sync Status
              </span>
              <div className="text-xs font-semibold text-[#3ecf8e] mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
                <span>Synchronized</span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-[#a0a0a0] font-mono">
            {lastPingResult.message}
          </div>
        </div>
      ) : (
        <div className="mt-5 bg-[#141414] border border-[#2e2e2e] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-[#a0a0a0]">
            <ShieldCheck className="w-4 h-4 text-[#3ecf8e]" />
            <span>Click &apos;Ping Node Agent&apos; above to initiate a live telemetry handshake test.</span>
          </div>
          <span className="text-xs font-mono text-[#a0a0a0] hidden sm:inline">
            Target: {selectedSite.site_name}
          </span>
        </div>
      )}

      {/* Terminal Curl Diagnostic */}
      <div className="mt-5 pt-5 border-t border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#a0a0a0]">
            <Terminal className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>CLI Diagnostic Test</span>
          </div>
          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1 text-[11px] text-[#3ecf8e] hover:text-[#3fcf8e] font-medium transition-colors"
          >
            {curlCopied ? <Check className="w-3 h-3 text-[#3ecf8e]" /> : <Copy className="w-3 h-3" />}
            <span>{curlCopied ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>

        <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-3 overflow-x-auto font-mono text-[11px] text-[#e0e0e0] leading-relaxed">
          <code>{testCurlCommand}</code>
        </div>
      </div>
    </div>
  );
}
