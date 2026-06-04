'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RatingBadgeProps {
  score: number;
  showScore?: boolean;
}

export function getRatingInfo(score: number) {
  if (score >= 90) return { label: 'Sangat Baik', color: 'bg-[var(--galactic-emerald)]/10 text-[var(--galactic-emerald)] border border-[var(--galactic-emerald)]/20 shadow-[0_0_10px_rgba(52,211,153,0.15)]', dotColor: 'bg-[var(--galactic-emerald)] shadow-[0_0_8px_var(--galactic-emerald)]' };
  if (score >= 75) return { label: 'Baik', color: 'bg-[var(--galactic-aurora)]/10 text-[var(--galactic-aurora-soft)] border border-[var(--galactic-aurora)]/20 shadow-[0_0_10px_rgba(124,58,237,0.15)]', dotColor: 'bg-[var(--galactic-aurora)] shadow-[0_0_8px_var(--galactic-aurora)]' };
  if (score >= 60) return { label: 'Cukup', color: 'bg-[var(--galactic-amber)]/10 text-[var(--galactic-amber)] border border-[var(--galactic-amber)]/20 shadow-[0_0_10px_rgba(251,191,36,0.15)]', dotColor: 'bg-[var(--galactic-amber)] shadow-[0_0_8px_var(--galactic-amber)]' };
  return { label: 'Kurang', color: 'bg-[var(--galactic-rose)]/10 text-[var(--galactic-rose)] border border-[var(--galactic-rose)]/20 shadow-[0_0_10px_rgba(251,113,133,0.15)]', dotColor: 'bg-[var(--galactic-rose)] shadow-[0_0_8px_var(--galactic-rose)]' };
}

export function RatingBadge({ score, showScore = true }: RatingBadgeProps) {
  const { label, color, dotColor } = getRatingInfo(score);

  return (
    <Badge variant="outline" className={cn('font-medium gap-1.5 ring-1 ring-white/5 backdrop-blur-md', color)}>
      <span className={cn('w-2 h-2 rounded-full', dotColor)} />
      {label}
      {showScore && <span className="ml-0.5 opacity-70">({score})</span>}
    </Badge>
  );
}
