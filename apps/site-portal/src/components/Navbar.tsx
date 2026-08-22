'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Radio, RotateCw } from 'lucide-react';
import { SiteSelector } from './SiteSelector';
import { useSite } from '@/lib/site-context';

export function Navbar() {
  const pathname = usePathname();
  const { hubConnected, refreshAll, isPinging, pingCurrentAgent } = useSite();

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/setup', label: 'Integration & Setup' },
    { href: '/allowlist', label: 'IP Allowlist' },
    { href: '/logs', label: 'Attack History' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#000000]/90 backdrop-blur border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo & Site Selector */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#3ecf8e] flex items-center justify-center transition-transform group-hover:scale-105">
                <Shield className="w-4 h-4 text-[#3ecf8e]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#ffffff] font-display tracking-tight">
                  NexusSecure
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-[#1a1a1a] border border-[#2e2e2e] text-[#3ecf8e] rounded-md">
                  Portal
                </span>
              </div>
            </Link>

            <div className="h-4 w-[1px] bg-[#262626] hidden sm:block" />

            <div className="hidden sm:block">
              <SiteSelector />
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1a1a1a] text-[#3ecf8e] border border-[#2e2e2e]'
                      : 'text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#141414]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right section: Status & Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* Hub Mesh status pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-md text-[11px] font-mono text-[#a0a0a0]">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                    hubConnected ? 'bg-[#3ecf8e] opacity-75' : 'bg-[#a0a0a0] opacity-40'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    hubConnected ? 'bg-[#3ecf8e]' : 'bg-[#a0a0a0]'
                  }`}
                />
              </span>
              <span className="hidden sm:inline font-sans font-medium text-xs text-[#ffffff]">
                {hubConnected ? 'Mesh Active' : 'Standalone'}
              </span>
            </div>

            {/* Quick Ping Button */}
            <button
              onClick={() => pingCurrentAgent()}
              disabled={isPinging}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2e2e2e] rounded-md text-xs font-medium text-[#ffffff] transition-all disabled:opacity-50"
              title="Ping agent node to check mesh response"
            >
              <Radio
                className={`w-3.5 h-3.5 text-[#3ecf8e] ${isPinging ? 'animate-pulse' : ''}`}
              />
              <span>{isPinging ? 'Pinging...' : 'Ping Node'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => refreshAll()}
              className="p-1.5 text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#1a1a1a] border border-[#262626] rounded-md transition-colors"
              title="Refresh telemetry and threat stats"
              aria-label="Refresh data"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Submenu & Site Selector */}
        <div className="flex sm:hidden items-center justify-between pb-3 pt-1 border-t border-[#262626]">
          <SiteSelector />
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#1a1a1a] text-[#3ecf8e] border border-[#2e2e2e]'
                      : 'text-[#a0a0a0] hover:bg-[#141414]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
