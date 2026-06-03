'use client';

import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const isAdmin = role === 'ADMIN';
  return (
    <Badge
      variant="outline"
      className={`text-xs ${
        isAdmin
          ? 'text-blue-600 bg-blue-50 border-blue-200'
          : 'text-slate-500 bg-slate-50'
      }`}
    >
      <Shield className="h-3 w-3 mr-1" />
      {isAdmin ? 'Admin' : 'Viewer'}
    </Badge>
  );
}
