'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RatingBadgeProps {
  score: number;
  showScore?: boolean;
}

export function getRatingInfo(score: number) {
  if (score >= 90) return { label: 'Sangat Baik', color: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/20', dotColor: 'bg-emerald-500' };
  if (score >= 75) return { label: 'Baik', color: 'bg-blue-500/15 text-blue-700 ring-blue-500/20', dotColor: 'bg-blue-500' };
  if (score >= 60) return { label: 'Cukup', color: 'bg-amber-500/15 text-amber-700 ring-amber-500/20', dotColor: 'bg-amber-500' };
  return { label: 'Kurang', color: 'bg-red-500/15 text-red-700 ring-red-500/20', dotColor: 'bg-red-500' };
}

export function RatingBadge({ score, showScore = true }: RatingBadgeProps) {
  const { label, color, dotColor } = getRatingInfo(score);

  return (
    <Badge variant="outline" className={cn('font-medium gap-1.5 ring-1', color)}>
      <span className={cn('w-2 h-2 rounded-full', dotColor)} />
      {label}
      {showScore && <span className="ml-0.5 opacity-70">({score})</span>}
    </Badge>
  );
}
