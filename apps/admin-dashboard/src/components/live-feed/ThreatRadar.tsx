'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { ThreatEvent } from '@/lib/types';
import { getCategoryBadge } from '@/lib/utils';
import { Shield, Radio, Crosshair } from 'lucide-react';

interface ThreatRadarProps {
  events: ThreatEvent[];
  isPaused: boolean;
}

export function ThreatRadar({ events, isPaused }: ThreatRadarProps) {
  const [activeBlips, setActiveBlips] = useState<
    { id: string; x: number; y: number; ip: string; category: string; age: number }[]
  >([]);

  // Map recent events to radar coordinates
  useEffect(() => {
    const recent = events.slice(0, 12).map((evt, idx) => {
      // Deterministic angle and radius based on IP hash
      const hash = evt.attackerIp.split('.').reduce((acc, part) => acc + parseInt(part || '0', 10), 0);
      const angle = ((hash * 47) % 360) * (Math.PI / 180);
      const radius = 25 + ((hash * 19) % 60); // 25% to 85% radius

      const x = 50 + radius * 0.45 * Math.cos(angle);
      const y = 50 + radius * 0.45 * Math.sin(angle);

      return {
        id: evt.id,
        x,
        y,
        ip: evt.attackerIp,
        category: evt.category,
        age: idx,
      };
    });

    setActiveBlips(recent);
  }, [events]);

  return (
    <Card className="h-full flex flex-col bg-[#ffffff] relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#171717]" />
            <CardTitle>Autonomous Defense Radar</CardTitle>
          </div>
          <span className="text-xs font-mono text-[#166534] bg-[#f0fdf4] px-2 py-0.5 rounded-full border border-[#bbf7d0]">
            360° Sweep Active
          </span>
        </div>
        <CardDescription>
          Real-time spatial visualization of incoming probes detected across mesh perimeters
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex items-center justify-center p-6 min-h-[360px]">
        <div className="relative w-72 h-72 sm:w-84 sm:h-84 rounded-full border border-[#ebebeb] bg-[#fafafa] flex items-center justify-center">
          {/* Concentric Rings */}
          <div className="absolute inset-4 rounded-full border border-[#ebebeb] border-dashed" />
          <div className="absolute inset-14 rounded-full border border-[#ebebeb]" />
          <div className="absolute inset-24 rounded-full border border-[#ebebeb] border-dashed" />

          {/* Crosshairs */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-px bg-[#ebebeb]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-full w-px bg-[#ebebeb]" />
          </div>

          {/* Sweep Animation */}
          {!isPaused && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none animate-radar-sweep origin-center"
              style={{
                background:
                  'conic-gradient(from 0deg at 50% 50%, rgba(23, 23, 23, 0.12) 0deg, rgba(23, 23, 23, 0.0) 60deg, transparent 360deg)',
              }}
            />
          )}

          {/* Center Hub Indicator */}
          <div className="relative z-10 w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center shadow-none">
            <Shield className="w-3.5 h-3.5" />
          </div>

          {/* Attack Blips */}
          {activeBlips.map((blip) => {
            const isFresh = blip.age <= 2;
            return (
              <div
                key={blip.id}
                className="absolute z-20 transition-all duration-500 group"
                style={{
                  left: `${blip.x}%`,
                  top: `${blip.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative flex items-center justify-center">
                  {isFresh && (
                    <span className="absolute inline-flex h-6 w-6 rounded-full bg-[#171717] opacity-40 animate-ping" />
                  )}
                  <span
                    className={`h-3 w-3 rounded-full border border-white cursor-pointer transition-transform group-hover:scale-150 ${
                      isFresh ? 'bg-[#171717]' : 'bg-[#737373]'
                    }`}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                    <div className="bg-[#171717] text-white text-[10px] font-mono px-2 py-1 rounded shadow-none whitespace-nowrap border border-[#404040]">
                      <p className="font-bold">{blip.ip}</p>
                      <p className="text-[#a3a3a3] capitalize">{blip.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
