'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Topbar() {
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
    <header className="h-16 glass border-b border-white/5 !ring-0 flex items-center justify-between px-8 sticky top-0 z-30">
      <h1 className="text-2xl font-heading font-semibold tracking-tight text-[var(--galactic-diamond)] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
        {getPageTitle()}
      </h1>
      
      <div className="flex items-center">
        <span className="text-sm text-[var(--galactic-diamond)]/70 font-medium tracking-wide">
          {formattedDate}
        </span>
      </div>
    </header>
  );
}
