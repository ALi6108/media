'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Share2, 
  Calendar, 
  FileText, 
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
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
    <div className="w-64 glass-sidebar text-[var(--galactic-diamond)] flex flex-col h-screen border-r border-white/5 relative z-20 shrink-0 shadow-[4px_0_24px_oklch(0_0_0/0.4)]">
      
      {/* Top Gradient Overlay */}
      <div className="absolute top-16 left-0 right-0 h-8 bg-gradient-to-b from-[var(--galactic-obsidian)] to-transparent pointer-events-none z-10" />

      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0 relative z-20">
        <Sparkles className="h-6 w-6 text-[var(--galactic-aurora-soft)] mr-3" />
        <span className="text-lg font-heading font-bold tracking-wide text-[var(--galactic-diamond)]">
          Media Analytics
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 relative z-0 scrollbar-none">
        <nav className="space-y-1.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-[var(--galactic-aurora)]/10 text-[var(--galactic-diamond)] border-l-[3px] border-[var(--galactic-aurora)]" 
                    : "text-[var(--galactic-diamond)]/70 hover:bg-white/[0.04] hover:text-[var(--galactic-diamond)]"
                )}
              >
                <Icon className={cn(
                  "mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-[var(--galactic-aurora-soft)]" : "text-[var(--galactic-diamond)]/70"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-white/5 shrink-0 relative z-20">
        <div className="flex items-center mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--galactic-aurora)] to-[var(--galactic-aurora)]/50 flex items-center justify-center text-white font-bold ring-2 ring-white/10 shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-semibold text-[var(--galactic-platinum)] truncate">
              {user?.name || 'Unknown User'}
            </p>
            <div className="mt-1 flex">
              <span className="text-xs uppercase tracking-wider text-[var(--galactic-diamond)]/80 truncate bg-white/5 backdrop-blur-md px-2 py-0.5 rounded-md ring-1 ring-white/10">
                {user?.role || 'GUEST'}
              </span>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-[var(--galactic-diamond)]/70 hover:text-[var(--galactic-rose)] hover:bg-[var(--galactic-rose)]/10 transition-all duration-300 rounded-xl group"
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
        >
          <LogOut className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
