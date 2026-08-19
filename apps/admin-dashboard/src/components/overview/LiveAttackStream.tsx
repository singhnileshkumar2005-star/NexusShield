'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, ArrowUpRight, ShieldAlert, CheckCircle2, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ThreatEvent } from '@/lib/types';
import { getCategoryBadge, formatRelativeTime } from '@/lib/utils';

interface LiveAttackStreamProps {
  events: ThreatEvent[];
  isConnected: boolean;
  connectionMode: 'sse_live' | 'simulated_mesh';
  limit?: number;
}

export function LiveAttackStream({
  events,
  isConnected,
  connectionMode,
  limit = 8,
}: LiveAttackStreamProps) {
  const displayEvents = events.slice(0, limit);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <CardTitle>Real-Time Global Threat Stream</CardTitle>
          </div>
          <Link
            href="/live-feed"
            className="text-xs font-medium text-[#171717] hover:text-[#4d4d4d] flex items-center gap-1 group"
          >
            Open Radar <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
        <CardDescription>
          Live anonymized threat detections ingested and corroborated across the mesh
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#ebebeb] bg-[#fafafa] text-[#8f8f8f] font-mono">
              <th className="py-2.5 px-4 font-medium">Attacker IP</th>
              <th className="py-2.5 px-4 font-medium">Threat Vector</th>
              <th className="py-2.5 px-4 font-medium">Confidence</th>
              <th className="py-2.5 px-4 font-medium">Corroboration</th>
              <th className="py-2.5 px-4 font-medium">Action</th>
              <th className="py-2.5 px-4 font-medium text-right">Detected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebebeb]">
            {displayEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#8f8f8f]">
                  Listening for incoming mesh threat events...
                </td>
              </tr>
            ) : (
              displayEvents.map((evt) => {
                const categoryMeta = getCategoryBadge(evt.category);
                const confidencePct = Math.round(evt.confidence * 100);

                return (
                  <tr
                    key={evt.id}
                    className="hover:bg-[#fafafa] transition-colors group animate-fade-in"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-[#171717] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                      <span>{evt.attackerIp}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${categoryMeta.badgeClass}`}
                      >
                        {categoryMeta.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#ebebeb] overflow-hidden">
                          <div
                            className="h-full bg-[#171717] rounded-full"
                            style={{ width: `${confidencePct}%` }}
                          />
                        </div>
                        <span className="text-[#171717] text-[11px]">
                          {confidencePct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fafafa] border border-[#ebebeb] text-[11px] text-[#171717]">
                        <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                        {evt.corroborationCount} {evt.corroborationCount === 1 ? 'node' : 'nodes'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#166534] bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                        DISTRIBUTED_BLOCK
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#8f8f8f] font-mono text-[11px]">
                      {formatRelativeTime(evt.timestamp)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
