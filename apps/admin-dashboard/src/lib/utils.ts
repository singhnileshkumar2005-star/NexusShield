import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ThreatCategory } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 5) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  } catch {
    return dateString;
  }
}

export function formatTtlRemaining(expiresAtString: string): { text: string; isExpired: boolean; hours: number } {
  try {
    const expiresAt = new Date(expiresAtString);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { text: 'Expired', isExpired: true, hours: 0 };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (totalHours > 24) {
      const days = Math.floor(totalHours / 24);
      const remainingHours = totalHours % 24;
      return { text: `${days}d ${remainingHours}h`, isExpired: false, hours: totalHours };
    }

    return { text: `${totalHours}h ${minutes}m`, isExpired: false, hours: totalHours };
  } catch {
    return { text: '24h', isExpired: false, hours: 24 };
  }
}

export function getCategoryBadge(category: ThreatCategory | string): {
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotColor: string;
} {
  switch (category) {
    case 'brute_force':
      return {
        label: 'Brute Force',
        shortLabel: 'BruteForce',
        badgeClass: 'bg-[#171717] text-white border-transparent',
        dotColor: 'bg-white',
      };
    case 'honeypot_probe':
      return {
        label: 'Honeypot Scanner',
        shortLabel: 'Honeypot',
        badgeClass: 'bg-[#fafafa] text-[#171717] border-[#ebebeb]',
        dotColor: 'bg-[#171717]',
      };
    case 'sqli_xss':
      return {
        label: 'SQLi / XSS Payload',
        shortLabel: 'SQLi/XSS',
        badgeClass: 'bg-[#f5f5f5] text-[#171717] border-[#d4d4d4]',
        dotColor: 'bg-[#4d4d4d]',
      };
    case 'rate_abuse':
      return {
        label: 'L7 Rate Abuse',
        shortLabel: 'Rate Limit',
        badgeClass: 'bg-white text-[#4d4d4d] border-[#ebebeb]',
        dotColor: 'bg-[#8f8f8f]',
      };
    case 'scanner':
    default:
      return {
        label: 'Recon Scanner',
        shortLabel: 'Scanner',
        badgeClass: 'bg-[#fafafa] text-[#666666] border-[#ebebeb]',
        dotColor: 'bg-[#8f8f8f]',
      };
  }
}
