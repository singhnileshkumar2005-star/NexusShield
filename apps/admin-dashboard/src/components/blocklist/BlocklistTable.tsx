'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldX,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BlocklistEntry, ThreatCategory } from '@/lib/types';
import { getCategoryBadge, formatTtlRemaining, formatRelativeTime } from '@/lib/utils';

interface BlocklistTableProps {
  entries: BlocklistEntry[];
  onRevokeBlock: (ip: string) => Promise<void>;
  onSelectEntry?: (entry: BlocklistEntry) => void;
}

export function BlocklistTable({
  entries,
  onRevokeBlock,
  onSelectEntry,
}: BlocklistTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [revokingIp, setRevokingIp] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.attackerIp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || entry.primaryCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchTerm, selectedCategory]);

  const handleRevoke = async (ip: string) => {
    if (confirm(`Are you sure you want to revoke network-wide block on ${ip}?`)) {
      setRevokingIp(ip);
      try {
        await onRevokeBlock(ip);
      } finally {
        setRevokingIp(null);
      }
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Active Network Blocklist</CardTitle>
            <CardDescription>
              Autonomous indicator of compromise (IoC) registry broadcast to member agents
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="black" size="md">
              {filteredEntries.length} Active Rules
            </Badge>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search by IP address or detection note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-60">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Threat Categories</option>
              <option value="brute_force">Brute Force / Auth Stuffing</option>
              <option value="honeypot_probe">Honeypot Scanner</option>
              <option value="sqli_xss">SQLi / XSS Injection</option>
              <option value="rate_abuse">Rate Abuse / Floods</option>
              <option value="scanner">Reconnaissance Scanners</option>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#ebebeb] bg-[#fafafa] text-[#8f8f8f] font-mono">
              <th className="py-3 px-4 font-medium">Attacker IP</th>
              <th className="py-3 px-4 font-medium">Threat Category</th>
              <th className="py-3 px-4 font-medium">Confidence</th>
              <th className="py-3 px-4 font-medium">Corroboration</th>
              <th className="py-3 px-4 font-medium">TTL Countdown</th>
              <th className="py-3 px-4 font-medium">Detection Note</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebebeb]">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#8f8f8f]">
                  No active blocked IPs match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const categoryMeta = getCategoryBadge(entry.primaryCategory);
                const ttl = formatTtlRemaining(entry.expiresAt);
                const confidencePct = Math.round(entry.confidence * 100);

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#fafafa] transition-colors group"
                  >
                    {/* IP */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#171717]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#171717]" />
                        <span>{entry.attackerIp}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${categoryMeta.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${categoryMeta.dotColor}`} />
                        {categoryMeta.label}
                      </span>
                    </td>

                    {/* Confidence Meter */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-[#ebebeb] overflow-hidden">
                          <div
                            className="h-full bg-[#171717] rounded-full"
                            style={{ width: `${confidencePct}%` }}
                          />
                        </div>
                        <span className="text-[#171717] font-medium">
                          {confidencePct}%
                        </span>
                      </div>
                    </td>

                    {/* Corroboration */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fafafa] border border-[#ebebeb] text-[11px] text-[#171717]">
                        <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                        {entry.corroborationCount} {entry.corroborationCount === 1 ? 'node' : 'nodes'}
                      </span>
                    </td>

                    {/* TTL */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#4d4d4d]">
                        <Clock className="w-3 h-3 text-[#8f8f8f]" />
                        {ttl.text}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-[#8f8f8f]">
                      {entry.notes || 'Automated multi-node detection'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRevoke(entry.attackerIp)}
                        loading={revokingIp === entry.attackerIp}
                        className="text-[#991b1b] hover:text-[#7f1d1d] hover:bg-[#fef2f2] hover:border-[#fecaca]"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Revoke Block
                      </Button>
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
