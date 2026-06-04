'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)]">{title}</h2>
        {subtitle && <p className="text-[var(--galactic-diamond)]/70 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
