'use client';

import React from 'react';
import { StatusBanner } from '@/components/StatusBanner';
import { MetricCards } from '@/components/MetricCards';
import { ThreatChart } from '@/components/ThreatChart';
import { RecentAttacksTable } from '@/components/RecentAttacksTable';
import { Code2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
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
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-card-subtle">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center flex-shrink-0">
            <Code2 className="w-5 h-5 text-[#3ecf8e]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#ffffff] font-display">
              Need to add or update your Agent middleware?
            </h3>
            <p className="text-xs text-[#a0a0a0] mt-0.5">
              Copy ready-to-run integration snippets for Next.js, Express, Fastify, Vanilla Node, and WordPress.
            </p>
          </div>
        </div>

        <Link
          href="/setup"
          className="px-4 py-2 bg-[#3ecf8e] hover:bg-[#3fcf8e] text-[#000000] rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Open Setup Wizard</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#000000]" />
        </Link>
      </div>
    </div>
  );
}
