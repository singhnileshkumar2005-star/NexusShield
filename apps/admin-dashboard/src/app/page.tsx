'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Users, Activity, Zap, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { ShieldStatusBanner } from '@/components/overview/ShieldStatusBanner';
import { ThreatBreakdownChart } from '@/components/overview/ThreatBreakdownChart';
import { AttackVolumeChart } from '@/components/overview/AttackVolumeChart';
import { LiveAttackStream } from '@/components/overview/LiveAttackStream';
import { NetworkStats } from '@/lib/types';
import { INITIAL_NETWORK_STATS } from '@/lib/mockData';
import { HubApi } from '@/lib/api';
import { useSSE } from '@/lib/useSSE';
import { formatNumber } from '@/lib/utils';

export default function OverviewPage() {
  const [stats, setStats] = useState<NetworkStats>(INITIAL_NETWORK_STATS);
  const [isTriggering, setIsTriggering] = useState(false);
  const { events, isConnected, connectionMode, triggerSimulatedAttack } = useSSE();

  useEffect(() => {
    HubApi.getStats().then((data) => {
      if (data) setStats(data);
    });

    const interval = setInterval(() => {
      HubApi.getStats().then((data) => {
        if (data) setStats(data);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    setIsTriggering(true);
    const newEvt = triggerSimulatedAttack();
    // Also update stats count
    setStats((prev) => ({
      ...prev,
      totalAttacksMitigated: prev.totalAttacksMitigated + 1,
      attacksToday: prev.attacksToday + 1,
    }));
    setTimeout(() => setIsTriggering(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Mesh Shield Status Banner */}
      <ShieldStatusBanner
        onTriggerSimulatedAttack={handleSimulate}
        isTriggering={isTriggering}
      />

      {/* 2. Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Attacks Mitigated */}
        <StatCard
          title="Total Mitigations"
          value={formatNumber(stats.totalAttacksMitigated)}
          description="Across all member websites"
          icon={<Shield className="w-4 h-4 text-[#171717]" />}
          trend={{ value: '+18.4% this week', isPositive: true }}
          badge={
            <Badge variant="outline" size="sm">
              All Nodes
            </Badge>
          }
        />

        {/* Metric 2: Active Blocked IPs */}
        <StatCard
          title="Active Blocked IPs"
          value={stats.activeBlockedIps}
          description="Live distributed IoCs"
          icon={<ShieldAlert className="w-4 h-4 text-[#171717]" />}
          trend={{ value: 'Auto-expiring (48h TTL)', isNeutral: true }}
          badge={
            <Badge variant="black" size="sm">
              Enforced
            </Badge>
          }
        />

        {/* Metric 3: Connected Member Sites */}
        <StatCard
          title="Member Sites"
          value={stats.connectedMemberSites}
          description="Active telemetry agents"
          icon={<Users className="w-4 h-4 text-[#171717]" />}
          trend={{ value: '100% heartbeat sync', isPositive: true }}
          badge={
            <Badge variant="success" size="sm" pulse>
              Live Mesh
            </Badge>
          }
        />

        {/* Metric 4: Mesh Health % */}
        <StatCard
          title="Mesh Health"
          value={`${stats.meshHealthPercent}%`}
          description="Zero-knowledge corroboration"
          icon={<Activity className="w-4 h-4 text-[#171717]" />}
          trend={{ value: 'P99 Latency: 38ms', isPositive: true }}
          badge={
            <Badge variant="default" size="sm">
              Optimal
            </Badge>
          }
        />
      </div>

      {/* 3. Analytics Section: Threat Category Breakdown + Attack Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ThreatBreakdownChart data={stats.categoryBreakdown} />
        </div>
        <div className="lg:col-span-2">
          <AttackVolumeChart data={stats.timelineData} />
        </div>
      </div>

      {/* 4. Real-Time Global Attack Stream */}
      <div className="w-full">
        <LiveAttackStream
          events={events}
          isConnected={isConnected}
          connectionMode={connectionMode}
          limit={10}
        />
      </div>
    </div>
  );
}
