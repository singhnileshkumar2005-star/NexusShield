'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Server,
  Download,
  Check,
  Save,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { PolicySettings } from '@/lib/types';
import { HubApi } from '@/lib/api';

export function PolicySettingsForm() {
  const [settings, setSettings] = useState<PolicySettings>({
    corroborationThreshold: 2,
    minConfidence: 0.90,
    defaultTtlHours: 48,
    hubEndpoint: 'http://localhost:3000',
    autoBlockHighConfidence: true,
    enableHoneypotNetwork: true,
    privacyPreservationMode: 'strict_anonymized',
    rateLimitThreshold: 120,
    emergencyKillSwitch: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    HubApi.getPolicySettings().then((loaded) => {
      if (loaded) setSettings(loaded);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await HubApi.savePolicySettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportIntel = async () => {
    const blocks = await HubApi.getBlocklist();
    const stixData = {
      type: 'bundle',
      id: `bundle--${Date.now()}`,
      spec_version: '2.1',
      objects: blocks.map((b) => ({
        type: 'indicator',
        id: `indicator--${b.id}`,
        created: b.firstDetected,
        modified: b.updatedAt,
        pattern: `[ipv4-addr:value = '${b.attackerIp}']`,
        pattern_type: 'stix',
        valid_from: b.firstDetected,
        valid_until: b.expiresAt,
        confidence: Math.round(b.confidence * 100),
        labels: [b.primaryCategory, 'malicious-activity'],
        description: b.notes || 'NexusSecure Mesh Corroborated Threat',
      })),
    };

    const blob = new Blob([JSON.stringify(stixData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexussecure-threat-intel-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportMessage('STIX 2.1 Threat Intel exported successfully.');
    setTimeout(() => setExportMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Corroboration & Defense Policies */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#3ecf8e]" />
              <CardTitle>Autonomous Defense & Corroboration Policy</CardTitle>
            </div>
            <CardDescription>
              Define the multi-party consensus rules before an attacker IP is broadcast as a network-wide block
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Corroboration Threshold */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#ffffff] flex items-center justify-between">
                  <span>Corroboration Threshold</span>
                  <span className="font-mono text-[#3ecf8e]">
                    {settings.corroborationThreshold} {settings.corroborationThreshold === 1 ? 'Site' : 'Independent Sites'}
                  </span>
                </label>
                <Select
                  value={settings.corroborationThreshold.toString()}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      corroborationThreshold: parseInt(e.target.value, 10),
                    })
                  }
                >
                  <option value="1">1 Member (Immediate Broadcast)</option>
                  <option value="2">2 Independent Members (Recommended)</option>
                  <option value="3">3 Independent Members (High Strictness)</option>
                  <option value="4">4 Independent Members (Enterprise)</option>
                </Select>
                <p className="text-[11px] text-[#a0a0a0]">
                  Requires distinct member node reports before escalating to a universal block rule.
                </p>
              </div>

              {/* Confidence Requirement */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#ffffff] flex items-center justify-between">
                  <span>Minimum Confidence Score</span>
                  <span className="font-mono text-[#3ecf8e]">
                    {Math.round(settings.minConfidence * 100)}%
                  </span>
                </label>
                <Select
                  value={settings.minConfidence.toString()}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minConfidence: parseFloat(e.target.value),
                    })
                  }
                >
                  <option value="0.75">0.75 (Lenient)</option>
                  <option value="0.85">0.85 (Balanced)</option>
                  <option value="0.90">0.90 (Recommended)</option>
                  <option value="0.95">0.95 (Strict / High Certainty Only)</option>
                </Select>
                <p className="text-[11px] text-[#a0a0a0]">
                  WAF signature or pattern certainty required to qualify for network ingestion.
                </p>
              </div>
            </div>

            {/* Default TTL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-[#262626]">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#ffffff] flex items-center justify-between">
                  <span>Default Block TTL (Self-Healing Expiry)</span>
                  <span className="font-mono text-[#3ecf8e]">{settings.defaultTtlHours} Hours</span>
                </label>
                <Select
                  value={settings.defaultTtlHours.toString()}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultTtlHours: parseInt(e.target.value, 10),
                    })
                  }
                >
                  <option value="24">24 Hours (Fast turnover)</option>
                  <option value="48">48 Hours (Recommended default)</option>
                  <option value="72">72 Hours (Standard)</option>
                  <option value="168">7 Days (Persistent botnets)</option>
                </Select>
                <p className="text-[11px] text-[#a0a0a0]">
                  Blocks automatically self-expire to avoid stale rules accumulating permanently.
                </p>
              </div>

              {/* Rate Limit Sensitiviy */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#ffffff] flex items-center justify-between">
                  <span>Rate Abuse Burst Threshold</span>
                  <span className="font-mono text-[#3ecf8e]">
                    {settings.rateLimitThreshold} req / min
                  </span>
                </label>
                <Select
                  value={settings.rateLimitThreshold.toString()}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rateLimitThreshold: parseInt(e.target.value, 10),
                    })
                  }
                >
                  <option value="60">60 req / min (Aggressive)</option>
                  <option value="120">120 req / min (Standard)</option>
                  <option value="240">240 req / min (High Traffic)</option>
                </Select>
                <p className="text-[11px] text-[#a0a0a0]">
                  Trigger threshold for flagging automated burst crawlers and mini-DDoS attacks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hub Coordinator Connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#3ecf8e]" />
              <CardTitle>Coordinator Hub Connectivity</CardTitle>
            </div>
            <CardDescription>
              Base endpoint URL for the central coordinator microservice
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#ffffff]">
                Coordinator API Endpoint
              </label>
              <Input
                placeholder="http://localhost:3000"
                value={settings.hubEndpoint}
                onChange={(e) =>
                  setSettings({ ...settings, hubEndpoint: e.target.value })
                }
                className="font-mono"
                required
              />
              <p className="text-[11px] text-[#a0a0a0]">
                All member agents poll or subscribe to SSE from this coordinator instance.
              </p>
            </div>

            <div className="p-3 bg-[#141414] border border-[#2e2e2e] rounded-xl text-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#3ecf8e] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-[#ffffff]">
                  Victim Anonymity Protocol: Active
                </span>
                <p className="text-[#a0a0a0] leading-relaxed">
                  No internal hostnames, requested paths, cookies, or payload content are ever
                  forwarded beyond the reporting node.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3ecf8e] bg-[#006239]/40 px-3 py-1.5 rounded-lg border border-[#3ecf8e]/30 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                Policies Saved & Distributed
              </span>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            type="submit"
            loading={isSaving}
            icon={<Save className="w-4 h-4 text-[#000000]" />}
          >
            Save Policy Configurations
          </Button>
        </div>
      </form>

      {/* Threat Intelligence Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#3ecf8e]" />
              <CardTitle>Export Threat Intelligence</CardTitle>
            </div>
            {exportMessage && (
              <span className="text-xs font-mono text-[#3ecf8e] bg-[#006239]/40 px-2.5 py-1 rounded border border-[#3ecf8e]/30">
                {exportMessage}
              </span>
            )}
          </div>
          <CardDescription>
            Download corroborated active indicators of compromise in standard STIX 2.1 JSON format for SIEM or firewall integration
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-xs text-[#a0a0a0]">
            Compatible with Splunk, Elastic Security, AWS GuardDuty, CrowdStrike, and fail2ban.
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportIntel}
            icon={<Download className="w-4 h-4 text-[#ffffff]" />}
          >
            Export STIX 2.1 Feed
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
