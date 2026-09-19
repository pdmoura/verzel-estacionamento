import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Extra classes for the desktop cell */
  className?: string;
  /** Hide the label on the mobile card (e.g. for the primary field) */
  primary?: boolean;
  /** Right-align (numbers, actions) */
  align?: 'left' | 'right' | 'center';
}

/**
 * Desktop: a regular table. Mobile (< md): one card per row with label/value
 * pairs, so nothing needs horizontal scrolling.
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
  const align = (a?: Column<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={className}>
      {/* Desktop */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-5 py-3 font-semibold', align(c.align))}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-5 py-3.5 align-middle text-text', align(c.align), c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => {
          const primary = columns.find((c) => c.primary);
          const rest = columns.filter((c) => !c.primary);
          return (
            <li key={rowKey(row)} className="space-y-2 px-4 py-4">
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
