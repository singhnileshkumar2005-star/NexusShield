'use client';

import React from 'react';
import { useSite } from '@/lib/site-context';
import { ShieldAlert, Shield, Gauge, Award, TrendingUp, CheckCircle } from 'lucide-react';

export function MetricCards() {
  const { stats, selectedSite } = useSite();

  const threatLevelDetails = {
    LOW: {
      label: 'Low Risk',
      badge: 'bg-[#fafafa] text-[#171717] border-[#ebebeb]',
      dot: 'bg-[#171717]',
      desc: 'Normal mesh traffic flow',
    },
    ELEVATED: {
      label: 'Elevated Threat',
      badge: 'bg-[#171717] text-[#ffffff] border-[#171717]',
      dot: 'bg-[#ffffff]',
      desc: 'Active distributed probing detected',
    },
    CRITICAL: {
      label: 'Critical Defense',
      badge: 'bg-[#000000] text-[#ffffff] border-[#000000]',
      dot: 'bg-[#ffffff] animate-ping',
      desc: 'High volume coordinated attack mitigated',
    },
  }[stats.threat_level];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Attacks Stopped */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#4d4d4d]">Attacks Stopped</span>
          <div className="w-7 h-7 rounded-md bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-[#171717]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-[#171717] font-mono tracking-tight">
              {stats.attacks_stopped_total.toLocaleString()}
            </span>
            <span className="text-xs text-[#8f8f8f] font-mono">total</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#4d4d4d]">
            <TrendingUp className="w-3.5 h-3.5 text-[#171717]" />
            <span>
              <strong className="font-mono text-[#171717]">+{stats.attacks_stopped_today}</strong> today
            </span>
            <span className="text-[#8f8f8f] font-mono ml-auto">100% blocked</span>
          </div>
        </div>
      </div>

      {/* Metric 2: Threat Level */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#4d4d4d]">Site Threat Level</span>
          <div className="w-7 h-7 rounded-md bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[#171717]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-semibold text-[#171717] tracking-tight">
              {stats.threat_level}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${threatLevelDetails.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${threatLevelDetails.dot}`} />
              {threatLevelDetails.label}
            </span>
          </div>

          <p className="text-xs text-[#8f8f8f] mt-2 truncate">
            {threatLevelDetails.desc}
          </p>
        </div>
      </div>

      {/* Metric 3: Agent Latency */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#4d4d4d]">Agent Latency</span>
          <div className="w-7 h-7 rounded-md bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center">
            <Gauge className="w-3.5 h-3.5 text-[#171717]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-[#171717] font-mono tracking-tight">
              {stats.agent_latency}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#4d4d4d]">
            <CheckCircle className="w-3.5 h-3.5 text-[#171717]" />
            <span>Zero App Overhead (In-Memory)</span>
          </div>
        </div>
      </div>

      {/* Metric 4: Reputation Tier */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#4d4d4d]">Reputation Tier</span>
          <div className="w-7 h-7 rounded-md bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center">
            <Award className="w-3.5 h-3.5 text-[#171717]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-[#171717] font-mono tracking-tight">
              {stats.reputation_score.toFixed(2)}
            </span>
            <span className="text-xs text-[#8f8f8f] font-mono">/ 5.00</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#171717] font-medium">
            <span className="truncate">{stats.reputation_tier}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
