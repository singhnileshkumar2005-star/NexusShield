'use client';

import React from 'react';
import { useSite } from '@/lib/site-context';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useSite();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'text-[#3ecf8e]';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-[#3ecf8e]';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-red-400';
        }

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-3.5 flex items-start gap-3 shadow-card-subtle transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
          >
            <div className="mt-0.5 flex-shrink-0">
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#ffffff] font-display leading-tight">
                {toast.title}
              </div>
              {toast.description && (
                <div className="text-xs text-[#a0a0a0] mt-1 leading-normal font-sans">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#a0a0a0] hover:text-[#ffffff] transition-colors p-0.5 rounded"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
