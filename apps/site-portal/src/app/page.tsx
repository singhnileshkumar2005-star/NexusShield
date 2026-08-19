'use client';

import React from 'react';
import { StatusBanner } from '@/components/StatusBanner';
import { MetricCards } from '@/components/MetricCards';
import { ThreatChart } from '@/components/ThreatChart';
import { RecentAttacksTable } from '@/components/RecentAttacksTable';
import { useSite } from '@/lib/site-context';
import { ShieldAlert, Code2, ArrowRight, Activity, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
  const { selectedSite } = useSite();

  return (
    <div className="space-y-6">
      {/* Header section with Protection Status Banner */}
      <StatusBanner />

      {/* 4 Core Metric Cards */}
      <MetricCards />

      {/* Visual Analytics & Breakdown */}
      <ThreatChart />

      {/* Recent Attacks Mitigated Table */}
      <RecentAttacksTable />

      {/* Bottom Integration Quickstart Card */}
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
            <Code2 className="w-5 h-5 text-[#171717]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#171717]">
              Need to add or update your Agent middleware?
            </h3>
            <p className="text-xs text-[#8f8f8f] mt-0.5">
              Copy ready-to-run integration snippets for Next.js, Express, Fastify, Vanilla Node, and WordPress.
            </p>
          </div>
        </div>

        <Link
          href="/setup"
          className="px-4 py-2 bg-[#000000] hover:bg-[#171717] text-[#ffffff] rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Open Setup Wizard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
