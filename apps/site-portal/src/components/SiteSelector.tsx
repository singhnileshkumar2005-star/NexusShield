'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSite } from '@/lib/site-context';
import { ChevronDown, Check, Plus, Globe, Shield } from 'lucide-react';
import { NewSiteModal } from './NewSiteModal';

export function SiteSelector() {
  const { sites, selectedSite, setSelectedSite } = useSite();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-[#ffffff] hover:bg-[#fafafa] border border-[#ebebeb] rounded-full text-xs font-medium text-[#171717] transition-all"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="w-2 h-2 rounded-full bg-[#171717] ring-2 ring-[#ebebeb]" />
          <span className="truncate max-w-[170px] sm:max-w-[220px] font-semibold text-[#171717]">
            {selectedSite.site_name}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#8f8f8f] transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1.5 w-72 bg-[#ffffff] border border-[#ebebeb] rounded-lg p-1.5 z-40 animate-in fade-in-50">
            <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-[#8f8f8f] uppercase">
              Registered Mesh Nodes
            </div>

            <div className="space-y-0.5 max-h-60 overflow-y-auto">
              {sites.map((site) => {
                const isCurrent = site.id === selectedSite.id;
                return (
                  <button
                    key={site.id}
                    onClick={() => {
                      setSelectedSite(site);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-md flex items-start justify-between gap-2 text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[#fafafa] text-[#171717] font-medium'
                        : 'hover:bg-[#fafafa] text-[#4d4d4d] hover:text-[#171717]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-[#171717]">
                          {site.site_name}
                        </span>
                        {site.threat_level === 'CRITICAL' && (
                          <span className="text-[10px] bg-[#171717] text-[#ffffff] px-1.5 py-0.2 rounded-full font-mono">
                            HIGH
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8f8f8f] truncate font-mono mt-0.5">
                        {site.site_url}
                      </div>
                    </div>
                    {isCurrent && (
                      <Check className="w-4 h-4 text-[#171717] flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-1 border-t border-[#ebebeb]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 text-xs text-[#171717] hover:bg-[#fafafa] transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-[#171717]" />
                <span>Register new website</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <NewSiteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
