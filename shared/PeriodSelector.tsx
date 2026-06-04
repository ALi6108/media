'use client';

import { Filter } from 'lucide-react';

interface PeriodSelectorProps {
  year: number;
  week?: number;
  onYearChange: (year: number) => void;
  onWeekChange?: (week: number) => void;
  showWeek?: boolean;
}

export function PeriodSelector({
  year,
  week,
  onYearChange,
  onWeekChange,
  showWeek = false,
}: PeriodSelectorProps) {
  const years = [2024, 2025, 2026, 2027];
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-3">
      <Filter className="h-4 w-4 text-[var(--galactic-diamond)]/60" />
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="h-8 rounded-lg border border-white/10 bg-white px-2 text-sm text-[var(--galactic-diamond)]/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      {showWeek && onWeekChange && week !== undefined && (
        <select
          value={week}
          onChange={(e) => onWeekChange(Number(e.target.value))}
          className="h-8 rounded-lg border border-white/10 bg-white px-2 text-sm text-[var(--galactic-diamond)]/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {weeks.map((w) => (
            <option key={w} value={w}>W{w}</option>
          ))}
        </select>
      )}
    </div>
  );
}
