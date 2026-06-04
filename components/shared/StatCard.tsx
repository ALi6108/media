'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'blue' | 'green' | 'amber' | 'red';
  isLoading?: boolean;
}

const iconColorStyles = {
  default: 'text-[var(--galactic-platinum)] drop-shadow-[0_0_8px_var(--galactic-platinum)]',
  blue: 'text-[var(--galactic-aurora-soft)] drop-shadow-[0_0_8px_var(--galactic-aurora)]',
  green: 'text-[var(--galactic-emerald)] drop-shadow-[0_0_8px_var(--galactic-emerald)]',
  amber: 'text-[var(--galactic-amber)] drop-shadow-[0_0_8px_var(--galactic-amber)]',
  red: 'text-[var(--galactic-rose)] drop-shadow-[0_0_8px_var(--galactic-rose)]',
};

const borderAccentStyles = {
  default: 'border-t-[var(--galactic-platinum)]/50',
  blue: 'border-t-[var(--galactic-aurora)]',
  green: 'border-t-[var(--galactic-emerald)]',
  amber: 'border-t-[var(--galactic-amber)]',
  red: 'border-t-[var(--galactic-rose)]',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <GlassCard className="relative overflow-hidden h-[140px] animate-pulse bg-white/5 border-white/5">
        <div className="p-6 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="h-4 w-24 bg-white/10 rounded-md" />
            <div className="h-8 w-8 bg-white/10 rounded-xl" />
          </div>
          <div className="h-8 w-16 bg-white/10 rounded-md mt-4" />
          <div className="h-3 w-32 bg-white/10 rounded-md mt-2" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard 
      variant="interactive" 
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border-t-2',
        borderAccentStyles[variant]
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--galactic-diamond)]/70">{title}</p>
            <p className="text-3xl font-heading font-bold text-[var(--galactic-diamond)] tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-[var(--galactic-diamond)]/70">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-md border backdrop-blur-md ring-1 ring-white/5',
                  trend.value >= 0 
                    ? 'bg-[var(--galactic-emerald)]/10 text-[var(--galactic-emerald)] border-[var(--galactic-emerald)]/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]' 
                    : 'bg-[var(--galactic-rose)]/10 text-[var(--galactic-rose)] border-[var(--galactic-rose)]/20 shadow-[0_0_10px_rgba(251,113,133,0.2)]'
                )}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-[var(--galactic-diamond)]/70">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl bg-white/5 ring-1 ring-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]')}>
            <Icon className={cn("h-6 w-6", iconColorStyles[variant])} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
