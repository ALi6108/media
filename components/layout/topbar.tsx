'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const [now, setNow] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Format pathname to display as title
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    const path = pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formattedDate = mounted
    ? now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <header className="h-16 glass border-b border-white/5 !ring-0 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[var(--galactic-diamond)]/70 hover:text-[var(--galactic-diamond)] -ml-2 shrink-0"
          aria-label="Buka menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-heading font-semibold tracking-tight text-[var(--galactic-diamond)] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] truncate">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center shrink-0">
        <span className="text-xs md:text-sm text-[var(--galactic-diamond)]/70 font-medium tracking-wide hidden sm:block">
          {formattedDate}
        </span>
      </div>
    </header>
  );
}
