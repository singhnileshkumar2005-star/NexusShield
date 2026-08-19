'use client';

import React from 'react';
import { Sliders, Shield, Info } from 'lucide-react';
import { PolicySettingsForm } from '@/components/settings/PolicySettingsForm';
import { Badge } from '@/components/ui/Badge';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171717]">
              Mesh Policy & Corroboration Tuning
            </h2>
            <Badge variant="outline" size="sm" className="font-mono">
              Consensus Engine v1
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#4d4d4d] mt-1">
            Tune multi-party corroboration sensitivity, automatic block TTLs, and central coordinator endpoints.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <PolicySettingsForm />
    </div>
  );
}
