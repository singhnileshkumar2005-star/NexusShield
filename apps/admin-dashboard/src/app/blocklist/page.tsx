'use client';

import React, { useState, useEffect } from 'react';
import { Ban, Plus, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { BlocklistTable } from '@/components/blocklist/BlocklistTable';
import { AddBlockModal } from '@/components/blocklist/AddBlockModal';
import { BlocklistEntry, ThreatCategory } from '@/lib/types';
import { HubApi } from '@/lib/api';
import { INITIAL_BLOCKLIST } from '@/lib/mockData';

export default function BlocklistPage() {
  const [entries, setEntries] = useState<BlocklistEntry[]>(INITIAL_BLOCKLIST);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadBlocklist = async () => {
    try {
      const data = await HubApi.getBlocklist();
      setEntries(data);
    } catch {
      // fallback to mock
    }
  };

  useEffect(() => {
    loadBlocklist();
  }, []);

  const handleAddBlock = async (data: {
    attackerIp: string;
    primaryCategory: ThreatCategory;
    confidence: number;
    ttlHours: number;
    notes?: string;
  }) => {
    const newEntry = await HubApi.addManualBlock(data);
    setEntries((prev) => [newEntry, ...prev.filter((e) => e.attackerIp !== newEntry.attackerIp)]);
  };

  const handleRevokeBlock = async (ip: string) => {
    await HubApi.revokeBlock(ip);
    setEntries((prev) => prev.filter((e) => e.attackerIp !== ip));
  };

  const activeCount = entries.filter((e) => e.isActive).length;
  const highConfidenceCount = entries.filter((e) => e.confidence >= 0.95).length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#ffffff] font-display">
            Global Blocklist Inspector
          </h2>
          <p className="text-xs sm:text-sm text-[#a0a0a0] mt-1">
            Network-wide distributed Indicators of Compromise (IoCs) enforced by member web application agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-4 h-4 text-[#000000]" />}
          >
            Add Manual Block
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Blocked IPs"
          value={activeCount}
          description="Distributed across member nodes"
          icon={<Ban className="w-4 h-4 text-[#3ecf8e]" />}
          badge={
            <Badge variant="black" size="sm">
              Enforcing
            </Badge>
          }
        />
        <StatCard
          title="High Certainty IoCs"
          value={highConfidenceCount}
          description="≥ 95% confidence score"
          icon={<ShieldAlert className="w-4 h-4 text-[#3ecf8e]" />}
          trend={{ value: 'Multi-node corroborated', isPositive: true }}
        />
        <StatCard
          title="Auto-Healing Policy"
          value="48h TTL"
          description="Stale blocks auto-evicted"
          icon={<Clock className="w-4 h-4 text-[#3ecf8e]" />}
          trend={{ value: 'Self-clearing', isNeutral: true }}
        />
      </div>

      {/* Blocklist Table */}
      <BlocklistTable
        entries={entries}
        onRevokeBlock={handleRevokeBlock}
      />

      {/* Add Manual Block Dialog */}
      <AddBlockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBlock={handleAddBlock}
      />
    </div>
  );
}
