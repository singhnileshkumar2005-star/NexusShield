'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dimmed backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-md bg-[#ffffff] border border-[#ebebeb] rounded-lg p-6 my-auto z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8f8f8f] hover:text-[#171717] hover:bg-[#fafafa] transition-colors p-1.5 rounded-full border border-transparent hover:border-[#ebebeb]"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#fafafa] border border-[#ebebeb] flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-[#171717]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#171717] tracking-tight">
              Register New Website
            </h3>
            <p className="text-xs text-[#8f8f8f]">
              Connect a new domain to the collaborative protection mesh.
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
              autoFocus
              placeholder="e.g. Production Storefront"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-[#ffffff] border border-[#ebebeb] rounded-lg text-[#171717] placeholder-[#8f8f8f] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-all"
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
                className="w-full text-xs pl-8 pr-3 py-2 bg-[#ffffff] border border-[#ebebeb] rounded-lg text-[#171717] placeholder-[#8f8f8f] focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-all font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#ebebeb]">
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
              className="px-4 py-2 text-xs font-medium text-[#ffffff] bg-[#000000] hover:bg-[#171717] disabled:opacity-50 rounded-full transition-all flex items-center gap-1.5"
            >
              <span>{isSubmitting ? 'Registering...' : 'Enlist Site'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
