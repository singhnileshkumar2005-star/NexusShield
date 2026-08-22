'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ThreatEvent } from '@/lib/types';
import { getCategoryBadge, formatRelativeTime } from '@/lib/utils';

interface LiveEventFeedProps {
  events: ThreatEvent[];
  isPaused: boolean;
  onTogglePause: () => void;
  onClearEvents: () => void;
  onTriggerAttack: () => void;
}

export function LiveEventFeed({
  events,
  isPaused,
  onTogglePause,
  onClearEvents,
  onTriggerAttack,
}: LiveEventFeedProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredEvents = events.filter(
    (e) => filterCategory === 'all' || e.category === filterCategory
  );

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'All Vectors' },
    { key: 'brute_force', label: 'Brute Force' },
    { key: 'honeypot_probe', label: 'Honeypot' },
    { key: 'sqli_xss', label: 'SQLi/XSS' },
    { key: 'rate_abuse', label: 'Rate Limit' },
    { key: 'scanner', label: 'Scanners' },
  ];

  return (
    <Card className="h-full flex flex-col shadow-card-subtle">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isPaused ? 'bg-amber-400' : 'bg-[#3ecf8e]'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isPaused ? 'bg-amber-500' : 'bg-[#3ecf8e]'
                }`}
              />
            </span>
            <div>
              <CardTitle>Live Mesh Ingestion Feed</CardTitle>
              <CardDescription>
                Server-Sent Events (SSE) pipe streaming raw anonymized indicators
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={onTriggerAttack}
              icon={<Zap className="w-3.5 h-3.5 text-[#000000]" />}
            >
              Trigger Test Attack
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onTogglePause}
              icon={isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearEvents}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 border-t border-[#262626]">
          {categories.map((c) => {
            const isSelected = filterCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setFilterCategory(c.key)}
                className={`text-xs px-3 py-1 rounded-lg font-mono transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#3ecf8e] text-[#000000] font-semibold'
                    : 'bg-[#141414] text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#222222] border border-[#2e2e2e]'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-[#262626] bg-[#141414] text-[#a0a0a0]">
              <th className="py-2.5 px-4 font-medium">Attacker IP</th>
              <th className="py-2.5 px-4 font-medium">Threat Signature</th>
              <th className="py-2.5 px-4 font-medium">Confidence</th>
              <th className="py-2.5 px-4 font-medium">Source Mesh Node</th>
              <th className="py-2.5 px-4 font-medium">Action</th>
              <th className="py-2.5 px-4 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#a0a0a0]">
                  No threat events matching filter. Waiting for events...
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const categoryMeta = getCategoryBadge(evt.category);
                const confidencePct = Math.round(evt.confidence * 100);

                return (
                  <tr
                    key={evt.id}
                    className="hover:bg-[#222222] transition-colors group animate-fade-in"
                  >
                    {/* Attacker IP */}
                    <td className="py-3 px-4 font-semibold text-[#ffffff]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
                        <span>{evt.attackerIp}</span>
                      </div>
                    </td>

                    {/* Threat Signature */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] w-fit border ${categoryMeta.badgeClass}`}
                        >
                          {categoryMeta.label}
                        </span>
                        {evt.payloadSignature && (
                          <span className="text-[10px] text-[#a0a0a0] mt-0.5 truncate max-w-xs">
                            {evt.payloadSignature}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-[#141414] border border-[#2e2e2e] overflow-hidden">
                          <div
                            className="h-full bg-[#3ecf8e] rounded-full"
                            style={{ width: `${confidencePct}%` }}
                          />
                        </div>
                        <span className="text-[#3ecf8e] text-[11px]">{confidencePct}%</span>
                      </div>
                    </td>

                    {/* Reporter Mesh Node (Anonymized) */}
                    <td className="py-3 px-4 text-[#a0a0a0]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#141414] border border-[#2e2e2e] text-[10px]">
                        {evt.reporterMeshId || 'node-anon-mesh'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#3ecf8e] bg-[#006239]/40 px-2 py-0.5 rounded border border-[#3ecf8e]/30">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        PREEMPTIVE_DROP
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-right text-[#a0a0a0] text-[11px]">
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
