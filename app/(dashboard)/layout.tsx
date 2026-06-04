'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden text-[var(--galactic-diamond)] relative">
      
      {/* Gradient Overlay for readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--galactic-obsidian)]/70 via-[var(--galactic-deep)]/50 to-[var(--galactic-obsidian)]/70" />
      
      {/* Premium Grain Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1] opacity-15 mix-blend-overlay"
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Main Layout Layer */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 relative z-0 scrollbar-none">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

    </div>
  );
}
