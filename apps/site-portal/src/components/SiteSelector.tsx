'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSite } from '@/lib/site-context';
import { ChevronDown, Check, Plus } from 'lucide-react';
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
          className="flex items-center gap-2.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2e2e2e] rounded-lg text-xs font-medium text-[#ffffff] transition-all"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="w-2 h-2 rounded-full bg-[#3ecf8e] ring-2 ring-[#006239]/50" />
          <span className="truncate max-w-[170px] sm:max-w-[220px] font-semibold text-[#ffffff]">
            {selectedSite.site_name}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#a0a0a0] transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1.5 w-72 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-1.5 z-40 shadow-2xl animate-in fade-in-50">
            <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-[#a0a0a0] uppercase font-mono">
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
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start justify-between gap-2 text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[#006239]/30 text-[#3ecf8e] font-medium border border-[#3ecf8e]/30'
                        : 'hover:bg-[#222222] text-[#a0a0a0] hover:text-[#ffffff]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-[#ffffff]">
                          {site.site_name}
                        </span>
                        {site.threat_level === 'CRITICAL' && (
                          <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/40 px-1.5 py-0.2 rounded-md font-mono">
                            HIGH
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#a0a0a0] truncate font-mono mt-0.5">
                        {site.site_url}
                      </div>
                    </div>
                    {isCurrent && (
                      <Check className="w-4 h-4 text-[#3ecf8e] flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-1 border-t border-[#262626]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs text-[#3ecf8e] hover:bg-[#222222] transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-[#3ecf8e]" />
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
