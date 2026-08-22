'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Ban,
  Users,
  Radio,
  Sliders,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/Badge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Operations Center',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Global Blocklist',
    href: '/blocklist',
    icon: Ban,
  },
  {
    name: 'Member Fleet',
    href: '/members',
    icon: Users,
  },
  {
    name: 'Live Threat Feed',
    href: '/live-feed',
    icon: Radio,
    badge: 'LIVE',
  },
  {
    name: 'Mesh Policies',
    href: '/settings',
    icon: Sliders,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-[#262626] bg-[#0a0a0a] flex flex-col justify-between h-screen sticky top-0 shrink-0">
      {/* Brand & Logo */}
      <div>
        <div className="h-16 px-6 border-b border-[#262626] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#006239] text-[#3ecf8e] border border-[#3ecf8e]/30 flex items-center justify-center transition-transform group-hover:scale-105">
              <Shield className="w-4 h-4 text-[#3ecf8e]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#ffffff] font-display tracking-tight flex items-center gap-1.5">
                NexusSecure
              </span>
              <span className="text-[10px] text-[#a0a0a0] font-mono leading-none">
                Mesh Central Hub
              </span>
            </div>
          </Link>
          <Badge variant="outline" size="sm" className="font-mono text-[10px] bg-[#1a1a1a] text-[#3ecf8e] border-[#2e2e2e]">
            v1.0
          </Badge>
        </div>

        {/* Status Indicator */}
        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-[#141414] border border-[#2e2e2e]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3ecf8e]" />
              </span>
              <span className="text-xs font-medium text-[#ffffff]">Mesh Shield</span>
            </div>
            <span className="text-[10px] font-mono text-[#3ecf8e] bg-[#006239]/40 px-1.5 py-0.5 rounded border border-[#3ecf8e]/30">
              SYNCHRONIZED
            </span>
          </div>
          <p className="text-[11px] text-[#a0a0a0] mt-1.5 leading-snug">
            Autonomous threat sharing active across all nodes.
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-medium text-[#525252] uppercase tracking-wider font-mono">
            Platform
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-[#1a1a1a] text-[#3ecf8e] border border-[#2e2e2e]'
                    : 'text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#141414] border border-transparent'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-[#3ecf8e]' : 'text-[#a0a0a0] group-hover:text-[#ffffff]'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#006239] text-[#3ecf8e] border border-[#3ecf8e]/30 rounded-md font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#262626] space-y-3">
        <div className="flex items-center justify-between text-xs text-[#a0a0a0]">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>Coordinator Node</span>
          </span>
          <span className="font-mono text-[11px] text-[#3ecf8e]">Online (SSE)</span>
        </div>
        <div className="text-[11px] text-[#525252] leading-snug">
          Privacy Guarantee: Victim identities and payloads are never disclosed or stored.
        </div>
      </div>
    </aside>
  );
}
