'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, TrendingUp, Share2, Calendar, FileText, Settings, X, Menu,
} from 'lucide-react';
import { useState } from 'react';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Anggota Tim', href: '/members', icon: Users },
    ...(isAdmin ? [{ name: 'Input Kinerja', href: '/members/performance', icon: TrendingUp }] : []),
    { name: 'Media Sosial', href: '/social-media', icon: Share2 },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Laporan', href: '/reports', icon: FileText },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-[var(--galactic-diamond)]/70 hover:text-[var(--galactic-diamond)]"
        aria-label="Buka menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--galactic-obsidian)] text-white shadow-xl animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
              <span className="text-lg font-bold">Media Analytics</span>
              <button onClick={() => setOpen(false)} className="text-[var(--galactic-diamond)]/80 hover:text-[var(--galactic-platinum)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                      isActive ? 'bg-[var(--galactic-aurora)] text-[var(--galactic-platinum)]' : 'text-[var(--galactic-diamond)]/70 hover:bg-white/[0.05] hover:text-[var(--galactic-platinum)]',
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
