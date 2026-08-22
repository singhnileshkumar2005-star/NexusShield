'use client';

import React, { useState } from 'react';
import { useSite } from '@/lib/site-context';
import { FRAMEWORK_GUIDES } from '@/lib/mock-data';
import { IntegrationFramework } from '@/lib/types';
import { CodeBlock } from '@/components/CodeBlock';
import { PingAgentCard } from '@/components/PingAgentCard';
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Zap,
  Info,
} from 'lucide-react';

export default function SetupWizardPage() {
  const { selectedSite, regenerateApiKey, addToast } = useSite();
  const [selectedFramework, setSelectedFramework] = useState<IntegrationFramework>('nextjs');
  const [showFullKey, setShowFullKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeGuide = FRAMEWORK_GUIDES.find((g) => g.id === selectedFramework) || FRAMEWORK_GUIDES[0];

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(selectedSite.api_key_full);
      setKeyCopied(true);
      addToast({
        type: 'success',
        title: 'API Key Copied',
        description: 'Site API key copied to clipboard.',
      });
      setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Are you sure you want to regenerate this API key? Existing running agents using the old key will lose connectivity until updated.')) {
      return;
    }
    setIsRegenerating(true);
    try {
      await regenerateApiKey();
    } finally {
      setIsRegenerating(false);
    }
  };

  // Replace placeholders in snippet
  const formattedCodeSnippet = activeGuide.codeSnippet
    .replace(/\{\{API_KEY\}\}/g, showFullKey ? selectedSite.api_key_full : selectedSite.api_key_masked)
    .replace(/\{\{SITE_NAME\}\}/g, selectedSite.site_name);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 shadow-card-subtle">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#006239]/40 border border-[#3ecf8e]/30 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-[#3ecf8e]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#ffffff] font-display tracking-tight">
              Integration & Setup Wizard
            </h1>
            <p className="text-xs text-[#a0a0a0] mt-0.5 max-w-3xl leading-relaxed">
              Equip <strong className="text-[#3ecf8e] font-semibold">{selectedSite.site_name}</strong> with the autonomous NexusSecure security agent. The agent runs locally inside your web stack, inspecting inbound requests in &lt;0.1ms and synchronizing threat signatures anonymously.
            </p>
          </div>
        </div>

        {/* API Key Credentials Box */}
        <div className="mt-5 bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#3ecf8e]" />
              <span className="text-xs font-semibold text-[#ffffff]">
                Site API Key (Node Authentication)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFullKey(!showFullKey)}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#1a1a1a] hover:bg-[#222222] text-[#a0a0a0] hover:text-[#ffffff] border border-[#2e2e2e] rounded-lg transition-colors inline-flex items-center gap-1"
              >
                {showFullKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showFullKey ? 'Hide Secret' : 'Reveal Secret'}</span>
              </button>

              <button
                onClick={handleCopyKey}
                className="px-3 py-1 text-[11px] font-semibold bg-[#3ecf8e] hover:bg-[#3fcf8e] text-[#000000] rounded-lg transition-colors inline-flex items-center gap-1"
              >
                {keyCopied ? <Check className="w-3 h-3 text-[#000000]" /> : <Copy className="w-3 h-3 text-[#000000]" />}
                <span>{keyCopied ? 'Copied' : 'Copy Key'}</span>
              </button>

              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="p-1 text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#1a1a1a] border border-transparent hover:border-[#2e2e2e] rounded-lg transition-colors"
                title="Regenerate API Key"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-3 font-mono text-xs text-[#3ecf8e] bg-[#121212] border border-[#2e2e2e] px-3.5 py-2 rounded-lg select-all overflow-x-auto">
            {showFullKey ? selectedSite.api_key_full : selectedSite.api_key_masked}
          </div>

          <div className="mt-2 text-[11px] text-[#a0a0a0] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>Store this key securely in your environment variable as <code className="font-mono text-[#3ecf8e]">NEXUS_API_KEY</code>.</span>
          </div>
        </div>
      </div>

      {/* Framework Selector Tabs */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 space-y-6 shadow-card-subtle">
        <div>
          <h2 className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider mb-3 font-mono">
            Select Your Web Framework / Runtime
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {FRAMEWORK_GUIDES.map((fw) => {
              const isSelected = selectedFramework === fw.id;
              return (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#006239]/40 border-[#3ecf8e] text-[#ffffff] shadow-md'
                      : 'bg-[#141414] hover:bg-[#222222] border-[#2e2e2e] text-[#ffffff]'
                  }`}
                >
                  <div className={`font-semibold text-xs ${isSelected ? 'text-[#3ecf8e]' : 'text-[#ffffff]'}`}>{fw.name}</div>
                  <div
                    className={`text-[10px] mt-0.5 truncate ${
                      isSelected ? 'text-[#3ecf8e]/80' : 'text-[#a0a0a0]'
                    }`}
                  >
                    {fw.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Framework Integration Guide */}
        <div className="space-y-5 pt-4 border-t border-[#262626]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#ffffff] font-display tracking-tight">
                  {activeGuide.name} Integration Guide
                </h3>
                <span className="text-[10px] font-mono bg-[#141414] border border-[#2e2e2e] px-2 py-0.5 rounded text-[#3ecf8e]">
                  {activeGuide.filename}
                </span>
              </div>
              <p className="text-xs text-[#a0a0a0] mt-1">{activeGuide.description}</p>
            </div>
          </div>

          {/* Key Capabilities Pills */}
          <div className="flex flex-wrap gap-2">
            {activeGuide.features.map((feat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#141414] border border-[#2e2e2e] text-[#3ecf8e]"
              >
                <Zap className="w-3 h-3 text-[#3ecf8e]" />
                {feat}
              </span>
            ))}
          </div>

          {/* Step 1: Install Command */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#ffffff] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#3ecf8e] text-[#000000] text-[10px] font-mono flex items-center justify-center font-bold">
                1
              </span>
              <span>Install Agent Dependency</span>
            </label>
            <div className="bg-[#121212] border border-[#2e2e2e] rounded-lg p-3 font-mono text-[11.5px] text-[#e0e0e0] flex items-center justify-between">
              <code>{activeGuide.installCommand}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeGuide.installCommand);
                  addToast({
                    type: 'info',
                    title: 'Command Copied',
                    description: 'Installation command copied to clipboard.',
                  });
                }}
                className="text-[#a0a0a0] hover:text-[#3ecf8e] p-1"
                title="Copy command"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Step 2: Code Snippet */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#ffffff] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#3ecf8e] text-[#000000] text-[10px] font-mono flex items-center justify-center font-bold">
                2
              </span>
              <span>Mount Middleware in <code className="font-mono text-xs text-[#3ecf8e]">{activeGuide.filename}</code></span>
            </label>
            <CodeBlock
              code={formattedCodeSnippet}
              filename={activeGuide.filename}
              language={activeGuide.id === 'php-wordpress' ? 'php' : 'typescript'}
            />
          </div>
        </div>
      </div>

      {/* Step 3: Test Connection / Ping Agent */}
      <PingAgentCard />
    </div>
  );
}
