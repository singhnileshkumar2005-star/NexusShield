import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';

export const metadata: Metadata = {
  title: 'NexusSecure | Mesh Central Admin Dashboard',
  description:
    'Collaborative Attack-Defense Threat Intelligence Mesh for Websites - Central Coordinator Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa] text-[#171717] antialiased">
        <div className="flex min-h-screen">
          {/* Main Navigation Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <TopNav />
            <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
