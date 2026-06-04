'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const isRedirecting = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  // Read auth state with individual selectors to avoid unnecessary re-renders
  const accessToken = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.user?.role);

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    // Check if already hydrated (e.g. during client-side navigation within same session)
    if (useAuthStore.persist.hasHydrated()) {
      setIsReady(true);
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsReady(true);
      unsub();
    });

    return () => {
      unsub();
    };
  }, []);

  // Auth routing logic — only runs after store is hydrated
  useEffect(() => {
    if (!isReady || isRedirecting.current) return;

    const isAuthRoute = pathname === '/login';

    if (!accessToken && !isAuthRoute) {
      isRedirecting.current = true;
      router.replace('/login');
      // Reset after navigation completes
      setTimeout(() => { isRedirecting.current = false; }, 500);
      return;
    }

    if (accessToken && isAuthRoute) {
      isRedirecting.current = true;
      router.replace('/');
      setTimeout(() => { isRedirecting.current = false; }, 500);
      return;
    }

    // Role-based route guard
    if (userRole === 'VIEWER') {
      const adminOnlyRoutes = ['/members/performance', '/members/add', '/settings/users'];
      if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
        isRedirecting.current = true;
        router.replace('/');
        setTimeout(() => { isRedirecting.current = false; }, 500);
      }
    }
  }, [isReady, accessToken, userRole, pathname, router]);

  // Show loading spinner while waiting for hydration
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--galactic-obsidian)]">
        <div className="w-8 h-8 border-4 border-white/[0.08] border-t-[var(--galactic-aurora)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // If on login page, render login regardless of auth state
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If not authenticated, show loading while redirecting to login
  if (!accessToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--galactic-obsidian)]">
        <div className="w-8 h-8 border-4 border-white/[0.08] border-t-[var(--galactic-aurora)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
