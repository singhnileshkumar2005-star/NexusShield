'use client';

import React from 'react';
import Link from 'next/link';
import { useSite } from '@/lib/site-context';
import { ShieldAlert, CheckCircle2, ArrowUpRight, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RecentAttacksTable() {
  const { attacks, quickAllowlistIp } = useSite();

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'brute_force':
        return { label: 'Brute Force', class: 'bg-[#006239]/40 text-[#3ecf8e] border-[#3ecf8e]/30' };
      case 'sqli_xss':
        return { label: 'SQLi / XSS', class: 'bg-[#bda4ff]/20 text-[#bda4ff] border-[#bda4ff]/30' };
      case 'honeypot_probe':
        return { label: 'Honeypot Trap', class: 'bg-[#006239]/40 text-[#3ecf8e] border-[#3ecf8e]/30' };
      case 'rate_abuse':
        return { label: 'Rate Abuse', class: 'bg-[#141414] text-[#a0a0a0] border-[#2e2e2e]' };
      case 'scanner':
        return { label: 'Vulnerability Scan', class: 'bg-[#006239]/40 text-[#3ecf8e] border-[#3ecf8e]/30' };
      case 'credential_stuffing':
        return { label: 'Credential Stuffing', class: 'bg-[#bda4ff]/20 text-[#bda4ff] border-[#bda4ff]/30' };
      default:
        return { label: category, class: 'bg-[#141414] text-[#a0a0a0] border-[#2e2e2e]' };
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BLOCKED_403':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#006239]/30 text-[#3ecf8e] border border-[#3ecf8e]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
            403 FORBIDDEN
          </span>
        );
      case 'RATE_LIMITED_429':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#141414] text-[#a0a0a0] border border-[#2e2e2e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a0a0a0]" />
            429 THROTTLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#141414] text-[#ffffff] border border-[#2e2e2e]">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden shadow-card-subtle">
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-[#3ecf8e]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#ffffff] font-display">
              Recent Attacks Mitigated on This Site
            </h3>
            <p className="text-[11px] text-[#a0a0a0]">
              Interception events autonomously handled at the application layer
            </p>
          </div>
        </div>

        <Link
          href="/logs"
          className="text-xs font-medium text-[#3ecf8e] hover:text-[#3fcf8e] flex items-center gap-1 self-start sm:self-auto transition-colors"
        >
          <span>View All Threat Logs</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table */}
      {attacks.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-[#3ecf8e] mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-[#ffffff]">No attacks recorded yet</h4>
          <p className="text-xs text-[#a0a0a0] mt-1">
            Your site is securely connected to the NexusSecure mesh.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#141414] border-b border-[#262626] text-[#a0a0a0] uppercase text-[10px] font-semibold tracking-wider font-mono">
                <th className="py-2.5 px-4">Attacker IP</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Target Path</th>
                <th className="py-2.5 px-4">Defense Action</th>
                <th className="py-2.5 px-4">Corroboration</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4 text-right">Quick Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {attacks.slice(0, 6).map((atk) => {
                const badge = getCategoryBadge(atk.category);
                let timeAgo = '';
                try {
                  timeAgo = formatDistanceToNow(new Date(atk.timestamp), { addSuffix: true });
                } catch {
                  timeAgo = 'just now';
                }

                return (
                  <tr
                    key={atk.id}
                    className="hover:bg-[#222222] transition-colors group"
                  >
                    {/* Attacker IP */}
                    <td className="py-3 px-4 font-mono text-[#ffffff] font-medium">
                      <div className="flex items-center gap-1.5">
                        {atk.origin_geo?.flag && <span>{atk.origin_geo.flag}</span>}
                        <span>{atk.attacker_ip}</span>
                      </div>
                    </td>

                    {/* Threat Category */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${badge.class}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Target Path */}
                    <td className="py-3 px-4 font-mono text-[#a0a0a0] max-w-[200px] truncate">
                      <span className="text-[10px] text-[#525252] mr-1 font-sans">
                        {atk.http_method}
                      </span>
                      <span title={atk.target_endpoint}>{atk.target_endpoint}</span>
                    </td>

                    {/* Defense Action */}
                    <td className="py-3 px-4">{getActionBadge(atk.action)}</td>

                    {/* Corroboration */}
                    <td className="py-3 px-4 font-mono text-xs text-[#a0a0a0]">
                      <span className="font-semibold text-[#ffffff]">
                        {atk.corroboration_count}
                      </span>{' '}
                      <span className="text-[10px] text-[#525252]">nodes</span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-[#a0a0a0] font-mono text-[11px]">
                      {timeAgo}
                    </td>

                    {/* Quick Allowlist */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          quickAllowlistIp(
                            atk.attacker_ip,
                            `Allowlisted from attack feed (${atk.category})`
                          )
                        }
                        className="opacity-80 group-hover:opacity-100 px-2.5 py-1 text-[11px] font-medium bg-[#141414] hover:bg-[#222222] text-[#ffffff] hover:text-[#3ecf8e] border border-[#2e2e2e] rounded-md transition-all inline-flex items-center gap-1"
                        title={`Allowlist ${atk.attacker_ip} to prevent blocking`}
                      >
                        <Plus className="w-3 h-3 text-[#3ecf8e]" />
                        <span>Allowlist</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
