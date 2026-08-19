'use client';

import React from 'react';
import Link from 'next/link';
import { useSite } from '@/lib/site-context';
import { ShieldAlert, CheckCircle2, UserX, ArrowUpRight, Plus, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RecentAttacksTable() {
  const { attacks, quickAllowlistIp } = useSite();

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'brute_force':
        return { label: 'Brute Force', class: 'bg-[#fafafa] text-[#171717] border-[#ebebeb]' };
      case 'sqli_xss':
        return { label: 'SQLi / XSS', class: 'bg-[#171717] text-[#ffffff] border-[#171717]' };
      case 'honeypot_probe':
        return { label: 'Honeypot Trap', class: 'bg-[#fafafa] text-[#171717] border-[#ebebeb]' };
      case 'rate_abuse':
        return { label: 'Rate Abuse', class: 'bg-[#fafafa] text-[#4d4d4d] border-[#ebebeb]' };
      case 'scanner':
        return { label: 'Vulnerability Scan', class: 'bg-[#fafafa] text-[#171717] border-[#ebebeb]' };
      case 'credential_stuffing':
        return { label: 'Credential Stuffing', class: 'bg-[#171717] text-[#ffffff] border-[#171717]' };
      default:
        return { label: category, class: 'bg-[#fafafa] text-[#4d4d4d] border-[#ebebeb]' };
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BLOCKED_403':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#fafafa] text-[#171717] border border-[#ebebeb]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
            403 FORBIDDEN
          </span>
        );
      case 'RATE_LIMITED_429':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#fafafa] text-[#4d4d4d] border border-[#ebebeb]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8f8f8f]" />
            429 THROTTLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#fafafa] text-[#171717] border border-[#ebebeb]">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ebebeb]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-[#171717]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#171717]">
              Recent Attacks Mitigated on This Site
            </h3>
            <p className="text-[11px] text-[#8f8f8f]">
              Interception events autonomously handled at the application layer
            </p>
          </div>
        </div>

        <Link
          href="/logs"
          className="text-xs font-medium text-[#171717] hover:text-[#4d4d4d] flex items-center gap-1 self-start sm:self-auto transition-colors"
        >
          <span>View All Threat Logs</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table */}
      {attacks.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-[#171717] mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-[#171717]">No attacks recorded yet</h4>
          <p className="text-xs text-[#8f8f8f] mt-1">
            Your site is securely connected to the NexusSecure mesh.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#ebebeb] text-[#8f8f8f] uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-2.5 px-4">Attacker IP</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Target Path</th>
                <th className="py-2.5 px-4">Defense Action</th>
                <th className="py-2.5 px-4">Corroboration</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4 text-right">Quick Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
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
                    className="hover:bg-[#fafafa] transition-colors group"
                  >
                    {/* Attacker IP */}
                    <td className="py-3 px-4 font-mono text-[#171717] font-medium">
                      <div className="flex items-center gap-1.5">
                        {atk.origin_geo?.flag && <span>{atk.origin_geo.flag}</span>}
                        <span>{atk.attacker_ip}</span>
                      </div>
                    </td>

                    {/* Threat Category */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.class}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Target Path */}
                    <td className="py-3 px-4 font-mono text-[#4d4d4d] max-w-[200px] truncate">
                      <span className="text-[10px] text-[#8f8f8f] mr-1 font-sans">
                        {atk.http_method}
                      </span>
                      <span title={atk.target_endpoint}>{atk.target_endpoint}</span>
                    </td>

                    {/* Defense Action */}
                    <td className="py-3 px-4">{getActionBadge(atk.action)}</td>

                    {/* Corroboration */}
                    <td className="py-3 px-4 font-mono text-xs text-[#4d4d4d]">
                      <span className="font-semibold text-[#171717]">
                        {atk.corroboration_count}
                      </span>{' '}
                      <span className="text-[10px] text-[#8f8f8f]">nodes</span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-[#8f8f8f] font-mono text-[11px]">
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
                        className="opacity-80 group-hover:opacity-100 px-2.5 py-1 text-[11px] font-medium bg-[#ffffff] hover:bg-[#fafafa] text-[#171717] border border-[#ebebeb] rounded-full transition-all inline-flex items-center gap-1"
                        title={`Allowlist ${atk.attacker_ip} to prevent blocking`}
                      >
                        <Plus className="w-3 h-3 text-[#171717]" />
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
