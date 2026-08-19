'use client';

import React, { useState } from 'react';
import { useSite } from '@/lib/site-context';
import { X, Globe, Shield, ArrowRight } from 'lucide-react';

interface NewSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewSiteModal({ isOpen, onClose }: NewSiteModalProps) {
  const { addNewSite } = useSite();
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;

    setIsSubmitting(true);
    try {
      await addNewSite(siteName.trim(), siteUrl.trim() || 'https://example.com');
      setSiteName('');
      setSiteUrl('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#ffffff] border border-[#ebebeb] rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8f8f8f] hover:text-[#171717] transition-colors p-1"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#171717]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#171717] tracking-tight">
              Register New Website
            </h3>
            <p className="text-xs text-[#8f8f8f]">
              Connect a new domain to the decentralized protection mesh.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4d4d4d] mb-1.5">
              Website Name <span className="text-[#171717]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Production Storefront"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-[#ffffff] border border-[#ebebeb] rounded-lg text-[#171717] placeholder-[#8f8f8f] focus:outline-none focus:border-[#171717] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4d4d4d] mb-1.5">
              Domain URL
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-[#8f8f8f] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="https://store.example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-[#ffffff] border border-[#ebebeb] rounded-lg text-[#171717] placeholder-[#8f8f8f] focus:outline-none focus:border-[#171717] transition-colors font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#4d4d4d] hover:text-[#171717] hover:bg-[#fafafa] rounded-full border border-[#ebebeb] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !siteName.trim()}
              className="px-4 py-2 text-xs font-medium text-[#ffffff] bg-[#000000] hover:bg-[#171717] disabled:opacity-50 rounded-full transition-colors flex items-center gap-1.5"
            >
              <span>{isSubmitting ? 'Registering...' : 'Enlist Site'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
