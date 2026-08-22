'use client';

import React from 'react';
import { AttackLogsTable } from '@/components/AttackLogsTable';
import { useSite } from '@/lib/site-context';
import { FileText } from 'lucide-react';

export default function LogsPage() {
  const { selectedSite, attacks } = useSite();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 shadow-card-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#3ecf8e]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#ffffff] font-display tracking-tight">
                Detailed Attack & Mitigation History
              </h1>
              <p className="text-xs text-[#a0a0a0] mt-0.5 max-w-3xl leading-relaxed">
                Auditable forensic log of all suspicious requests intercepted and deflected on{' '}
                <strong className="text-[#3ecf8e] font-semibold">{selectedSite.site_name}</strong>. No customer payloads or private query secrets are stored or shared.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-[#141414] border border-[#2e2e2e] px-3.5 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-[#a0a0a0]">Logged Events:</span>
            <span className="font-semibold text-[#3ecf8e]">{attacks.length}</span>
          </div>
        </div>
      </div>

      {/* Main Filterable Logs Table */}
      <AttackLogsTable />
    </div>
  );
}
