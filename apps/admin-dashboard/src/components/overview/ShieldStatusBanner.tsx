'use client';

import React from 'react';
import { Shield, Lock, Zap, CheckCircle2 } from 'lucide-react';
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
    <div className="rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-6 relative overflow-hidden shadow-card-subtle">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#006239] text-[#3ecf8e] border border-[#3ecf8e]/30 text-xs font-semibold font-mono">
              <Shield className="w-3.5 h-3.5" />
              MESH SHIELD: ACTIVE & SYNCHRONIZED
            </span>
            <Badge variant="outline" size="sm" className="font-mono text-[11px] bg-[#141414] text-[#a0a0a0] border-[#2e2e2e]">
              <Lock className="w-3 h-3 mr-1 text-[#3ecf8e]" />
              Zero-Knowledge Victim Privacy Enforced
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#ffffff] font-display">
            Collaborative Neighborhood Defense Network
          </h2>
          <p className="text-sm text-[#a0a0a0] max-w-2xl leading-relaxed">
            When any member node detects malicious scanning, brute force, or SQLi attempts, the
            threat fingerprint is instantly corroborated and distributed to all member sites within
            milliseconds.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {onTriggerSimulatedAttack && (
            <Button
              variant="primary"
              size="md"
              onClick={onTriggerSimulatedAttack}
              loading={isTriggering}
              icon={<Zap className="w-4 h-4 text-[#000000]" />}
            >
              Simulate Attacker Probe
            </Button>
          )}

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141414] border border-[#2e2e2e] text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#3ecf8e]" />
            <div className="flex flex-col">
              <span className="font-medium text-[#ffffff]">Preemptive Blocking</span>
              <span className="text-[11px] text-[#3ecf8e] font-mono">P99 Latency: ~38ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
