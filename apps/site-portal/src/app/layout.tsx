import type { Metadata } from 'next';
import './globals.css';
import { SiteProvider } from '@/lib/site-context';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'NexusSecure | Client Site Owner Portal',
  description:
    'Sovereign Threat Prevention & Security Telemetry Portal for Protected Websites.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#000000]">
      <body className="min-h-full flex flex-col font-sans antialiased text-[#ffffff] bg-[#000000]">
        <SiteProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            {children}
          </main>
          <footer className="border-t border-[#262626] bg-[#0a0a0a] py-6 text-center text-xs text-[#a0a0a0]">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#ffffff] flex items-center gap-1.5 font-display">
                  <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
                  NexusSecure
                </span>
                <span className="text-[#525252]">•</span>
                <span className="text-[#a0a0a0]">Collaborative Attack-Defense Threat Mesh</span>
              </div>
              <div className="font-mono text-[11px] text-[#a0a0a0]">
                Sovereign Privacy Guarantee: Zero Payload Disclosure
              </div>
            </div>
          </footer>
          <ToastContainer />
        </SiteProvider>
      </body>
    </html>
  );
}
