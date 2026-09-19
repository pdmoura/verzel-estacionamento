import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  primary?: boolean;
  align?: 'left' | 'right' | 'center';
}

/**
 * Desktop: table with a light header row and hairline dividers.
 * Mobile (< md): one block per row with label/value pairs.
 */
export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  className?: string;
}) {
  const align = (a?: Column<T>['align']) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  return (
    <div className={className}>
      <div className="hidden md:block">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="border-y border-border bg-[#f8fafc] text-sm font-semibold text-muted">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-6 py-3', align(c.align))}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-6 py-5 align-middle text-text', align(c.align), c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border border-t border-border md:hidden">
        {rows.map((row) => {
          const primary = columns.find((c) => c.primary);
          const rest = columns.filter((c) => !c.primary);
          return (
            <li key={rowKey(row)} className="space-y-2 px-5 py-4">
              {primary && <div className="text-base font-semibold text-text">{primary.cell(row)}</div>}
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 text-sm">
                {rest.map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-muted">{c.header}</dt>
                    <dd className="text-right text-text">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
