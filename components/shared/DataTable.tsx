'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({ data, columns, keyExtractor }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--galactic-diamond)]/70 border border-white/10 rounded-xl">
        Tidak ada data yang ditemukan.
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <Table>
        <TableHeader className="bg-white/[0.02]">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)} className="font-semibold text-[var(--galactic-diamond)]/90">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={keyExtractor(item)}>
              {columns.map((col) => (
                <TableCell key={String(col.key)} className="py-3">
                  {col.render ? col.render(item) : String(item[col.key as keyof T] || '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
