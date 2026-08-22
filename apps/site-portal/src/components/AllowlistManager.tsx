'use client';

import React, { useState, useMemo } from 'react';
import { useSite } from '@/lib/site-context';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Search,
  Download,
  Layers,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function AllowlistManager() {
  const {
    allowlist,
    selectedSite,
    addAllowlistEntry,
    deleteAllowlistEntry,
    toggleAllowlistEntry,
    addToast,
  } = useSite();

  const [searchQuery, setSearchQuery] = useState('');
  const [ipInput, setIpInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredAllowlist = useMemo(() => {
    if (!searchQuery.trim()) return allowlist;
    const query = searchQuery.toLowerCase();
    return allowlist.filter(
      (entry) =>
        entry.ip_or_cidr.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query)
    );
  }, [allowlist, searchQuery]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ip = ipInput.trim();
    if (!ip) return;

    setIsAdding(true);
    try {
      await addAllowlistEntry(ip, descInput.trim());
      setIpInput('');
      setDescInput('');
      setShowAddForm(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(allowlist, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `allowlist-${selectedSite.site_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      type: 'info',
      title: 'Allowlist Exported',
      description: 'Downloaded allowlist configurations as JSON.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner info */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 shadow-card-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#3ecf8e]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#ffffff] font-display tracking-tight">
                Site-Specific IP / CIDR Allowlist
              </h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5 max-w-2xl">
                IP addresses and CIDR subnets listed here bypass all NexusSecure mesh blocking rules on{' '}
                <strong className="text-[#3ecf8e] font-semibold">{selectedSite.site_name}</strong>. Ideal for office VPNs, CI/CD runners, and developer machines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportJson}
              className="px-3.5 py-1.5 bg-[#141414] hover:bg-[#222222] border border-[#2e2e2e] rounded-lg text-xs font-medium text-[#ffffff] transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#3ecf8e]" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-1.5 bg-[#3ecf8e] hover:bg-[#3fcf8e] text-[#000000] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Close Form' : 'Add IP / Subnet'}</span>
            </button>
          </div>
        </div>

        {/* Inline Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="mt-5 pt-5 border-t border-[#262626] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end animate-in fade-in"
          >
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-medium text-[#a0a0a0] mb-1">
                IP Address or CIDR Subnet <span className="text-[#3ecf8e]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 198.51.100.24 or 10.0.0.0/16"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#2e2e2e] rounded-lg text-[#ffffff] placeholder-[#525252] focus:outline-none focus:border-[#3ecf8e] font-mono transition-colors"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] font-medium text-[#a0a0a0] mb-1">
                Description / Memo
              </label>
              <input
                type="text"
                placeholder="e.g. Corporate VPN Gateway"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#2e2e2e] rounded-lg text-[#ffffff] placeholder-[#525252] focus:outline-none focus:border-[#3ecf8e] transition-colors"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isAdding || !ipInput.trim()}
                className="w-full py-2 bg-[#3ecf8e] hover:bg-[#3fcf8e] disabled:opacity-50 text-[#000000] rounded-lg text-xs font-semibold transition-colors"
              >
                {isAdding ? 'Adding...' : 'Save Rule'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden shadow-card-subtle">
        {/* Search & Stats Bar */}
        <div className="p-4 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#525252] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by IP, subnet or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#141414] border border-[#2e2e2e] rounded-lg text-[#ffffff] placeholder-[#525252] focus:outline-none focus:border-[#3ecf8e] transition-colors font-mono"
            />
          </div>

          <div className="text-xs font-mono text-[#a0a0a0] flex items-center gap-2">
            <span>Total Active Rules:</span>
            <strong className="text-[#3ecf8e] font-semibold">
              {allowlist.filter((e) => e.is_active).length}
            </strong>
          </div>
        </div>

        {/* Allowlist Table */}
        {filteredAllowlist.length === 0 ? (
          <div className="p-8 text-center">
            <Layers className="w-8 h-8 text-[#525252] mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-[#ffffff]">
              {searchQuery ? 'No matching allowlist rules found' : 'No allowlist rules configured'}
            </h4>
            <p className="text-xs text-[#a0a0a0] mt-1">
              Add your trusted IPs or subnets to guarantee they are never blocked.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#141414] border-b border-[#262626] text-[#a0a0a0] uppercase text-[10px] font-semibold tracking-wider font-mono">
                  <th className="py-2.5 px-4">IP / CIDR Range</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Bypassed Hits</th>
                  <th className="py-2.5 px-4">Created Date</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredAllowlist.map((entry) => {
                  let timeAgo = '';
                  try {
                    timeAgo = formatDistanceToNow(new Date(entry.created_at), {
                      addSuffix: true,
                    });
                  } catch {
                    timeAgo = 'recently';
                  }

                  const isCidr = entry.ip_or_cidr.includes('/');

                  return (
                    <tr key={entry.id} className="hover:bg-[#222222] transition-colors group">
                      {/* IP / CIDR */}
                      <td className="py-3 px-4 font-mono text-[#ffffff] font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{entry.ip_or_cidr}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] uppercase font-mono rounded border ${
                              isCidr
                                ? 'bg-[#006239]/40 text-[#3ecf8e] border-[#3ecf8e]/30'
                                : 'bg-[#141414] text-[#a0a0a0] border-[#2e2e2e]'
                            }`}
                          >
                            {isCidr ? 'Subnet' : 'Host IP'}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-[#a0a0a0] max-w-[280px] truncate">
                        {entry.description || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleAllowlistEntry(entry.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                            entry.is_active
                              ? 'bg-[#006239]/30 text-[#3ecf8e] border-[#3ecf8e]/40 hover:bg-[#006239]/50'
                              : 'bg-[#141414] text-[#525252] border-[#2e2e2e]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              entry.is_active ? 'bg-[#3ecf8e]' : 'bg-[#525252]'
                            }`}
                          />
                          <span>{entry.is_active ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Bypassed Hits */}
                      <td className="py-3 px-4 font-mono text-xs text-[#ffffff]">
                        {entry.bypassed_count.toLocaleString()}{' '}
                        <span className="text-[10px] text-[#525252]">requests</span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-[#a0a0a0] font-mono text-[11px]">
                        {timeAgo}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteAllowlistEntry(entry.id)}
                          className="p-1 text-[#525252] hover:text-red-400 hover:bg-[#141414] border border-transparent hover:border-red-900/40 rounded transition-colors"
                          title="Delete allowlist rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
