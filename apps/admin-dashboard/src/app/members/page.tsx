'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Star, Activity, Server } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { MemberTable } from '@/components/members/MemberTable';
import { RegisterMemberModal } from '@/components/members/RegisterMemberModal';
import { MemberSite } from '@/lib/types';
import { HubApi } from '@/lib/api';
import { INITIAL_MEMBERS } from '@/lib/mockData';
import { formatNumber } from '@/lib/utils';

export default function MembersPage() {
  const [members, setMembers] = useState<MemberSite[]>(INITIAL_MEMBERS);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const loadMembers = async () => {
    const data = await HubApi.getMembers();
    if (data) setMembers(data);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleRegister = async (siteName: string, siteUrl: string) => {
    const newMember = await HubApi.registerMember(siteName, siteUrl);
    setMembers((prev) => [newMember, ...prev]);
    return newMember;
  };

  const handleUpdateReputation = async (memberId: string, newScore: number) => {
    await HubApi.updateMemberReputation(memberId, newScore);
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, reputationScore: newScore } : m))
    );
  };

  const totalFleetMitigations = members.reduce((acc, m) => acc + m.totalMitigations, 0);
  const avgReputation = (
    members.reduce((acc, m) => acc + m.reputationScore, 0) / (members.length || 1)
  ).toFixed(2);
  const onlineCount = members.filter((m) => m.status === 'online').length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171717]">
            Member Fleet & Reputation
          </h2>
          <p className="text-xs sm:text-sm text-[#4d4d4d] mt-1">
            Directory of registered member websites participating in collaborative defense and threat sharing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsRegisterOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Register New Member Site
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Member Nodes"
          value={`${onlineCount} / ${members.length}`}
          description="Transmitting live telemetry"
          icon={<Server className="w-4 h-4 text-[#171717]" />}
          badge={
            <Badge variant="success" size="sm" pulse>
              Live
            </Badge>
          }
        />
        <StatCard
          title="Fleet Average Reputation"
          value={`${avgReputation} / 5.0`}
          description="High trust consensus score"
          icon={<Star className="w-4 h-4 text-[#171717]" />}
          trend={{ value: 'Consensus verified', isPositive: true }}
        />
        <StatCard
          title="Fleet Mitigations"
          value={formatNumber(totalFleetMitigations)}
          description="Neutralized at edge perimeters"
          icon={<ShieldCheck className="w-4 h-4 text-[#171717]" />}
          trend={{ value: '+14% network effect', isPositive: true }}
        />
      </div>

      {/* Member Directory Table */}
      <MemberTable
        members={members}
        onUpdateReputation={handleUpdateReputation}
      />

      {/* Register New Member Modal */}
      <RegisterMemberModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegister}
      />
    </div>
  );
}
