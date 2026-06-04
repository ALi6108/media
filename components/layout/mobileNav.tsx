'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, TrendingUp, Share2, Calendar, FileText, Settings, X,
} from 'lucide-react';

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--galactic-obsidian)] text-white shadow-xl animate-in slide-in-from-left duration-200">
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <span className="text-lg font-bold">Media Analytics</span>
          <button onClick={onClose} className="text-[var(--galactic-diamond)]/80 hover:text-[var(--galactic-platinum)]">
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
                onClick={onClose}
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
  );
}
