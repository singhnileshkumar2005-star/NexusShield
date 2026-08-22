'use client';

import React from 'react';
import { useSite } from '@/lib/site-context';
import { ShieldAlert, Shield, Gauge, Award, TrendingUp, CheckCircle } from 'lucide-react';

export function MetricCards() {
  const { stats } = useSite();

  const threatLevelDetails = {
    LOW: {
      label: 'Low Risk',
      badge: 'bg-[#006239]/40 text-[#3ecf8e] border-[#3ecf8e]/30',
      dot: 'bg-[#3ecf8e]',
      desc: 'Normal mesh traffic flow',
    },
    ELEVATED: {
      label: 'Elevated Threat',
      badge: 'bg-[#bda4ff]/20 text-[#bda4ff] border-[#bda4ff]/40',
      dot: 'bg-[#bda4ff]',
      desc: 'Active distributed probing detected',
    },
    CRITICAL: {
      label: 'Critical Defense',
      badge: 'bg-red-950/50 text-red-400 border-red-800/50',
      dot: 'bg-red-400 animate-ping',
      desc: 'High volume coordinated attack mitigated',
    },
  }[stats.threat_level];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Attacks Stopped */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between hover:border-[#3ecf8e]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#a0a0a0]">Attacks Stopped</span>
          <div className="w-7 h-7 rounded-md bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-[#3ecf8e]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-[#ffffff] font-mono tracking-tight">
              {stats.attacks_stopped_total.toLocaleString()}
            </span>
            <span className="text-xs text-[#a0a0a0] font-mono">total</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#a0a0a0]">
            <TrendingUp className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>
              <strong className="font-mono text-[#3ecf8e]">+{stats.attacks_stopped_today}</strong> today
            </span>
            <span className="text-[#a0a0a0] font-mono ml-auto">100% blocked</span>
          </div>
        </div>
      </div>

      {/* Metric 2: Threat Level */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between hover:border-[#3ecf8e]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#a0a0a0]">Site Threat Level</span>
          <div className="w-7 h-7 rounded-md bg-[#141414] border border-[#2e2e2e] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[#3ecf8e]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-semibold text-[#ffffff] font-display tracking-tight">
              {stats.threat_level}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${threatLevelDetails.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${threatLevelDetails.dot}`} />
              {threatLevelDetails.label}
            </span>
          </div>

          <p className="text-xs text-[#a0a0a0] mt-2 truncate">
            {threatLevelDetails.desc}
          </p>
        </div>
      </div>

      {/* Metric 3: Agent Latency */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between hover:border-[#3ecf8e]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#a0a0a0]">Agent Latency</span>
          <div className="w-7 h-7 rounded-md bg-[#141414] border border-[#2e2e2e] flex items-center justify-center">
            <Gauge className="w-3.5 h-3.5 text-[#3ecf8e]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-[#ffffff] font-mono tracking-tight">
              {stats.agent_latency}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#3ecf8e]">
            <CheckCircle className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>Zero App Overhead (In-Memory)</span>
          </div>
        </div>
      </div>

      {/* Metric 4: Reputation Tier */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between hover:border-[#3ecf8e]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#a0a0a0]">Reputation Tier</span>
          <div className="w-7 h-7 rounded-md bg-[#141414] border border-[#2e2e2e] flex items-center justify-center">
            <Award className="w-3.5 h-3.5 text-[#3ecf8e]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-[#ffffff] font-mono tracking-tight">
              {stats.reputation_score.toFixed(2)}
            </span>
            <span className="text-xs text-[#a0a0a0] font-mono">/ 5.00</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#3ecf8e] font-medium">
            <span className="truncate">{stats.reputation_tier}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
