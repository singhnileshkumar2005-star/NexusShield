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
        let iconColor = 'text-[#171717]';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'text-[#171717]';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-[#4d4d4d]';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-[#171717]';
        }

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#ffffff] border border-[#ebebeb] rounded-lg p-3.5 flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
          >
            <div className="mt-0.5 flex-shrink-0">
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#171717] leading-tight">
                {toast.title}
              </div>
              {toast.description && (
                <div className="text-xs text-[#4d4d4d] mt-1 leading-normal font-sans">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#8f8f8f] hover:text-[#171717] transition-colors p-0.5 rounded"
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
