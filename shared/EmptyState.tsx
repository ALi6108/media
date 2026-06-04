'use client';

import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Belum ada data',
  description = 'Belum ada data yang tersedia untuk ditampilkan.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-[var(--galactic-diamond)]/60" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--galactic-diamond)]/90">{title}</h3>
      <p className="text-sm text-[var(--galactic-diamond)]/70 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
