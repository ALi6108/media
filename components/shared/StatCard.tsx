'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'blue' | 'green' | 'amber' | 'red';
}

const variantStyles = {
  default: 'from-slate-500 to-slate-600',
  blue: 'from-blue-500 to-indigo-600',
  green: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-600',
  red: 'from-rose-500 to-red-600',
};

const iconBgStyles = {
  default: 'bg-white/20',
  blue: 'bg-white/20',
  green: 'bg-white/20',
  amber: 'bg-white/20',
  red: 'bg-white/20',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <Card className={cn(
      'relative overflow-hidden border-0 shadow-lg transition-transform duration-200 hover:scale-[1.02]',
      `bg-gradient-to-br ${variantStyles[variant]}`
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/60">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                  trend.value >= 0 ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
                )}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-white/50">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconBgStyles[variant])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
