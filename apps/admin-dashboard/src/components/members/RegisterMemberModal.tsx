'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Copy, Check, Shield, Terminal } from 'lucide-react';
import { MemberSite } from '@/lib/types';

interface RegisterMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (siteName: string, siteUrl: string) => Promise<MemberSite & { apiKey: string }>;
}

export function RegisterMemberModal({
  isOpen,
  onClose,
  onRegister,
}: RegisterMemberModalProps) {
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredResult, setRegisteredResult] = useState<(MemberSite & { apiKey: string }) | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      setError('Please provide a site name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onRegister(siteName, siteUrl);
      setRegisteredResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to register new member node.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSiteName('');
    setSiteUrl('');
    setRegisteredResult(null);
    setCopiedKey(false);
    setCopiedSnippet(false);
    setError('');
    onClose();
  };

  const copyApiKey = () => {
    if (registeredResult?.apiKey) {
      navigator.clipboard.writeText(registeredResult.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const codeSnippet = registeredResult
    ? `import express from 'express';
import { nexusSecureExpress } from '@nexussecure/agent';

const app = express();

app.use(
  nexusSecureExpress({
    apiKey: '${registeredResult.apiKey}',
    hubUrl: 'http://localhost:3000',
    siteName: '${registeredResult.siteName}',
    enableHoneypots: true,
    enableSqliXssFilter: true,
    maxFailedLogins: 5
  })
);`
    : '';

  const copySnippet = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={registeredResult ? 'Member Registered Successfully' : 'Register New Member Site'}
      description={
        registeredResult
          ? 'Securely store the API key below. For security, raw keys are never shown again.'
          : 'Enlist a new website into the collaborative defense mesh to exchange anonymized threat telemetry.'
      }
      maxWidth="lg"
    >
      {!registeredResult ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/40 text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#ffffff]">
              Site / Application Name
            </label>
            <Input
              placeholder="e.g. Production Storefront API"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#ffffff]">
              Target Hostname / URL (Optional)
            </label>
            <Input
              placeholder="e.g. https://api.production-domain.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
            <p className="text-[11px] text-[#a0a0a0]">
              Note: This URL is used purely for owner identification and is never shared in IoC broadcasts.
            </p>
          </div>

          <div className="p-3 bg-[#141414] border border-[#2e2e2e] rounded-xl text-xs space-y-1">
            <div className="font-semibold text-[#3ecf8e] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#3ecf8e]" />
              Privacy-by-Design Promise
            </div>
            <p className="text-[#a0a0a0] leading-snug">
              Every member receives an anonymous Member ID. Attack reports only convey attacker IPs and threat signatures.
            </p>
          </div>

          <div className="pt-3 border-t border-[#262626] flex items-center justify-end gap-2">
            <Button variant="secondary" size="md" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" loading={loading}>
              Generate API Key & Register
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          {/* API Key Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#ffffff] flex items-center justify-between">
              <span>Secret Mesh API Key</span>
              <span className="text-[11px] text-[#3ecf8e]">Copy and keep safe</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#141414] border border-[#2e2e2e] px-3 py-2 rounded-lg font-mono text-xs text-[#3ecf8e] select-all truncate">
                {registeredResult.apiKey}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={copyApiKey}
                icon={copiedKey ? <Check className="w-3.5 h-3.5 text-[#000000]" /> : <Copy className="w-3.5 h-3.5 text-[#000000]" />}
              >
                {copiedKey ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Member Details */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#141414] border border-[#2e2e2e] rounded-xl text-xs font-mono">
            <div>
              <span className="text-[#a0a0a0] block">Anonymous Node ID:</span>
              <span className="text-[#ffffff] font-semibold truncate block">{registeredResult.id}</span>
            </div>
            <div>
              <span className="text-[#a0a0a0] block">Initial Reputation:</span>
              <span className="text-[#3ecf8e] font-semibold">1.00 (Neutral)</span>
            </div>
          </div>

          {/* Integration Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#ffffff] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#3ecf8e]" />
                Quick Integration (Node.js / Express Middleware)
              </label>
              <button
                type="button"
                onClick={copySnippet}
                className="text-[11px] text-[#3ecf8e] hover:text-[#3fcf8e] font-medium flex items-center gap-1"
              >
                {copiedSnippet ? <Check className="w-3 h-3 text-[#3ecf8e]" /> : <Copy className="w-3 h-3" />}
                {copiedSnippet ? 'Copied Snippet' : 'Copy Code'}
              </button>
            </div>
            <pre className="p-3 bg-[#121212] text-[#e0e0e0] rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-[#2e2e2e]">
              {codeSnippet}
            </pre>
          </div>

          <div className="pt-3 border-t border-[#262626] flex items-center justify-end">
            <Button variant="primary" size="md" onClick={handleClose}>
              Done & Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
