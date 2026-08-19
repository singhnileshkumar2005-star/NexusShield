'use client';

import React, { useState, useMemo } from 'react';
import { useSite } from '@/lib/site-context';
import {
  Search,
  Download,
  Filter,
  ShieldAlert,
  ArrowUpDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export function AttackLogsTable() {
  const { attacks, selectedSite, quickAllowlistIp, refreshAll, addToast } = useSite();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories = [
    { id: 'all', label: 'All Threats' },
    { id: 'sqli_xss', label: 'SQLi / XSS' },
    { id: 'brute_force', label: 'Brute Force' },
    { id: 'honeypot_probe', label: 'Honeypots' },
    { id: 'rate_abuse', label: 'Rate Abuse' },
    { id: 'scanner', label: 'Scanners' },
  ];

  const filteredAttacks = useMemo(() => {
    return attacks.filter((atk) => {
      // Category filter
      if (selectedCategory !== 'all' && atk.category !== selectedCategory) {
        return false;
      }
      // Action filter
      if (selectedAction !== 'all' && atk.action !== selectedAction) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchIp = atk.attacker_ip.toLowerCase().includes(q);
        const matchEndpoint = atk.target_endpoint.toLowerCase().includes(q);
        const matchCategory = atk.category.toLowerCase().includes(q);
        const matchAgent = atk.user_agent_excerpt.toLowerCase().includes(q);
        if (!matchIp && !matchEndpoint && !matchCategory && !matchAgent) {
          return false;
        }
      }
      return true;
    });
  }, [attacks, selectedCategory, selectedAction, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAttacks.length / itemsPerPage));
  const paginatedAttacks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAttacks.slice(start, start + itemsPerPage);
  }, [filteredAttacks, currentPage]);

  const handleExportCsv = () => {
    if (filteredAttacks.length === 0) return;

    const headers = ['Timestamp', 'Attacker IP', 'Category', 'Action', 'Endpoint', 'HTTP Method', 'Confidence', 'User Agent'];
    const rows = filteredAttacks.map((a) => [
      a.timestamp,
      a.attacker_ip,
      a.category,
      a.action,
      `"${a.target_endpoint.replace(/"/g, '""')}"`,
      a.http_method,
      a.confidence,
      `"${a.user_agent_excerpt.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `nexussecure-attacks-${selectedSite.site_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    addToast({
      type: 'info',
      title: 'Attack Logs Exported',
      description: `Downloaded ${filteredAttacks.length} attack log entries as CSV.`,
    });
  };

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
        return { label: 'Scanner Probe', class: 'bg-[#fafafa] text-[#171717] border-[#ebebeb]' };
      case 'credential_stuffing':
        return { label: 'Credential Stuffing', class: 'bg-[#171717] text-[#ffffff] border-[#171717]' };
      default:
        return { label: category, class: 'bg-[#fafafa] text-[#4d4d4d] border-[#ebebeb]' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#171717] text-[#ffffff]'
                  : 'bg-[#fafafa] hover:bg-[#ebebeb] text-[#4d4d4d] border border-[#ebebeb]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8f8f8f] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by IP, URL, or agent..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#fafafa] border border-[#ebebeb] rounded-full text-[#171717] placeholder-[#8f8f8f] focus:outline-none focus:border-[#171717] transition-colors"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 bg-[#ffffff] hover:bg-[#fafafa] border border-[#ebebeb] rounded-full text-xs font-medium text-[#171717] transition-colors flex items-center gap-1.5"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-[#171717]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg overflow-hidden">
        {filteredAttacks.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldAlert className="w-8 h-8 text-[#8f8f8f] mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-[#171717]">No attack logs match your criteria</h4>
            <p className="text-xs text-[#8f8f8f] mt-1">
              Try adjusting your search query or threat category filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#ebebeb] text-[#8f8f8f] uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-2.5 px-4">Attacker IP</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Target Endpoint</th>
                  <th className="py-2.5 px-4">Client User-Agent</th>
                  <th className="py-2.5 px-4">Defense Verdict</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Allowlist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {paginatedAttacks.map((atk) => {
                  const badge = getCategoryBadge(atk.category);
                  let formattedDate = '';
                  try {
                    formattedDate = format(new Date(atk.timestamp), 'yyyy-MM-dd HH:mm:ss');
                  } catch {
                    formattedDate = atk.timestamp;
                  }

                  return (
                    <tr key={atk.id} className="hover:bg-[#fafafa] transition-colors group">
                      {/* Attacker IP */}
                      <td className="py-3 px-4 font-mono text-[#171717] font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {atk.origin_geo?.flag && <span>{atk.origin_geo.flag}</span>}
                          <span>{atk.attacker_ip}</span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.class}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Target Endpoint */}
                      <td className="py-3 px-4 font-mono text-[#4d4d4d] max-w-[220px] truncate">
                        <span className="text-[10px] text-[#8f8f8f] mr-1 font-sans">
                          {atk.http_method}
                        </span>
                        <span title={atk.target_endpoint}>{atk.target_endpoint}</span>
                      </td>

                      {/* User Agent */}
                      <td className="py-3 px-4 text-[#8f8f8f] font-mono text-[11px] max-w-[180px] truncate">
                        <span title={atk.user_agent_excerpt}>{atk.user_agent_excerpt}</span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#fafafa] text-[#171717] border border-[#ebebeb]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                          {atk.action}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-[#8f8f8f] font-mono text-[11px] whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Quick Allowlist Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() =>
                            quickAllowlistIp(
                              atk.attacker_ip,
                              `Allowlisted from attack log (${atk.category})`
                            )
                          }
                          className="opacity-75 group-hover:opacity-100 px-2.5 py-1 text-[11px] font-medium bg-[#ffffff] hover:bg-[#fafafa] text-[#171717] border border-[#ebebeb] rounded-full transition-all inline-flex items-center gap-1"
                          title="Exempt IP from future blocks"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 bg-[#fafafa] border-t border-[#ebebeb] flex items-center justify-between text-xs text-[#8f8f8f]">
            <div>
              Showing{' '}
              <strong className="text-[#171717]">
                {(currentPage - 1) * itemsPerPage + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-[#171717]">
                {Math.min(currentPage * itemsPerPage, filteredAttacks.length)}
              </strong>{' '}
              of <strong className="text-[#171717]">{filteredAttacks.length}</strong> events
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-[#ebebeb] bg-[#ffffff] hover:bg-[#fafafa] disabled:opacity-40 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-[#171717]" />
              </button>

              <span className="px-2 font-mono text-[#171717]">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-[#ebebeb] bg-[#ffffff] hover:bg-[#fafafa] disabled:opacity-40 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 text-[#171717]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
