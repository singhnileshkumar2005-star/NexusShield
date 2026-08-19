'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Globe,
  Star,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Shield,
  Copy,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MemberSite } from '@/lib/types';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

interface MemberTableProps {
  members: MemberSite[];
  onUpdateReputation?: (memberId: string, newScore: number) => Promise<void>;
}

export function MemberTable({ members, onUpdateReputation }: MemberTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredMembers = members.filter(
    (m) =>
      m.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.siteUrl && m.siteUrl.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Connected Member Fleet</CardTitle>
            <CardDescription>
              Nodes actively reporting threat vectors and enforcing distributed blocklists
            </CardDescription>
          </div>
          <Badge variant="black" size="md">
            {members.length} Registered Nodes
          </Badge>
        </div>

        {/* Search */}
        <div className="mt-4">
          <Input
            placeholder="Search member nodes by site name, node ID, or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#ebebeb] bg-[#fafafa] text-[#8f8f8f] font-mono">
              <th className="py-3 px-4 font-medium">Site Name & Node ID</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Reputation Score</th>
              <th className="py-3 px-4 font-medium">Total Mitigations</th>
              <th className="py-3 px-4 font-medium">Last Heartbeat</th>
              <th className="py-3 px-4 font-medium text-right">Privacy Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebebeb]">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#8f8f8f]">
                  No member websites found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const repPercent = Math.min(100, Math.round((member.reputationScore / 5.0) * 100));

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-[#fafafa] transition-colors group"
                  >
                    {/* Site Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#171717]">
                            {member.siteName}
                          </span>
                          {member.siteUrl && (
                            <a
                              href={member.siteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#8f8f8f] hover:text-[#171717] transition-colors"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-[#8f8f8f]">
                          <span>ID: {member.id.substring(0, 18)}...</span>
                          <button
                            onClick={() => copyId(member.id)}
                            className="p-0.5 hover:text-[#171717] transition-colors"
                            title="Copy full member ID"
                          >
                            {copiedId === member.id ? (
                              <Check className="w-3 h-3 text-[#166534]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {member.status === 'online' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#fafafa] text-[#8f8f8f] border border-[#ebebeb]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8f8f8f]" />
                          Idle
                        </span>
                      )}
                    </td>

                    {/* Reputation Score */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#ebebeb] overflow-hidden">
                          <div
                            className="h-full bg-[#171717] rounded-full"
                            style={{ width: `${repPercent}%` }}
                          />
                        </div>
                        <span className="font-semibold text-[#171717]">
                          {member.reputationScore.toFixed(2)}
                        </span>
                        <span className="text-[#8f8f8f] text-[10px]">/ 5.00</span>
                      </div>
                    </td>

                    {/* Mitigations */}
                    <td className="py-3.5 px-4 font-mono font-medium text-[#171717]">
                      {formatNumber(member.totalMitigations)}
                    </td>

                    {/* Heartbeat */}
                    <td className="py-3.5 px-4 font-mono text-[#4d4d4d]">
                      {formatRelativeTime(member.lastHeartbeat)}
                    </td>

                    {/* Privacy */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#fafafa] text-[#171717] border border-[#ebebeb]">
                        <Shield className="w-3 h-3 text-[#171717]" />
                        Anonymized
                      </span>
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
