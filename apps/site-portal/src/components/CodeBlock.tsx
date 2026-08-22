'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { useSite } from '@/lib/site-context';

interface CodeBlockProps {
  code: string;
  filename?: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  filename,
  language = 'typescript',
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useSite();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Snippet Copied',
        description: 'Code snippet copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className="bg-[#141414] rounded-xl border border-[#2e2e2e] overflow-hidden text-xs shadow-card-subtle">
      {/* Header bar */}
      <div className="bg-[#0f0f0f] px-4 py-2.5 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-2 text-[#a0a0a0]">
          <Terminal className="w-3.5 h-3.5 text-[#3ecf8e]" />
          <span className="font-mono text-[11px] text-[#ffffff]">{filename || 'Integration Snippet'}</span>
          {language && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-[#006239]/40 text-[#3ecf8e] border border-[#3ecf8e]/30 rounded-md">
              {language}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#1a1a1a] hover:bg-[#222222] text-[#3ecf8e] border border-[#2e2e2e] transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#3ecf8e]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-[#a0a0a0]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-[#e0e0e0]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-[#1a1a1a]/50">
                {showLineNumbers && (
                  <td className="pr-4 text-right select-none text-[#525252] font-mono text-[10px] w-8 align-top pt-0.5">
                    {idx + 1}
                  </td>
                )}
                <td className="whitespace-pre align-top font-mono">
                  {line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
