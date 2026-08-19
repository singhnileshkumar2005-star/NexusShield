'use client';

import React from 'react';
import { Shield, Lock, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ShieldStatusBannerProps {
  onTriggerSimulatedAttack?: () => void;
  isTriggering?: boolean;
}

export function ShieldStatusBanner({
  onTriggerSimulatedAttack,
  isTriggering = false,
}: ShieldStatusBannerProps) {
  return (
    <div className="rounded-lg border border-[#ebebeb] bg-white p-6 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171717] text-white text-xs font-medium font-mono">
              <Shield className="w-3.5 h-3.5" />
              MESH SHIELD: ACTIVE & SYNCHRONIZED
            </span>
            <Badge variant="outline" size="sm" className="font-mono text-[11px]">
              <Lock className="w-3 h-3 mr-1 text-[#171717]" />
              Zero-Knowledge Victim Privacy Enforced
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171717]">
            Collaborative Neighborhood Defense Network
          </h2>
          <p className="text-sm text-[#4d4d4d] max-w-2xl leading-relaxed">
            When any member node detects malicious scanning, brute force, or SQLi attempts, the
            threat fingerprint is instantly corroborated and distributed to all member sites within
            milliseconds.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {onTriggerSimulatedAttack && (
            <Button
              variant="secondary"
              size="md"
              onClick={onTriggerSimulatedAttack}
              loading={isTriggering}
              icon={<Zap className="w-4 h-4 text-[#171717]" />}
            >
              Simulate Attacker Probe
            </Button>
          )}

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fafafa] border border-[#ebebeb] text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#166534]" />
            <div className="flex flex-col">
              <span className="font-medium text-[#171717]">Preemptive Blocking</span>
              <span className="text-[11px] text-[#8f8f8f] font-mono">P99 Latency: ~38ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
