'use client';

import React from 'react';
import { AttackLogsTable } from '@/components/AttackLogsTable';
import { useSite } from '@/lib/site-context';
import { ShieldAlert, Activity, FileText } from 'lucide-react';

export default function LogsPage() {
  const { selectedSite, attacks } = useSite();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#171717]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#171717] tracking-tight">
                Detailed Attack & Mitigation History
              </h1>
              <p className="text-xs text-[#8f8f8f] mt-0.5 max-w-3xl leading-relaxed">
                Auditable forensic log of all suspicious requests intercepted and deflected on{' '}
                <strong className="text-[#171717] font-semibold">{selectedSite.site_name}</strong>. No customer payloads or private query secrets are stored or shared.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-[#fafafa] border border-[#ebebeb] px-3.5 py-1.5 rounded-full text-xs font-mono">
            <span className="text-[#8f8f8f]">Logged Events:</span>
            <span className="font-semibold text-[#171717]">{attacks.length}</span>
          </div>
        </div>
      </div>

      {/* Main Filterable Logs Table */}
      <AttackLogsTable />
    </div>
  );
}
