import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './card';

const TONE = {
  brand: 'bg-brand-soft text-brand-strong dark:text-blue-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  return (
    <Card className={cn('flex items-center gap-4 p-5', className)}>
      <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl [&>svg]:size-6', TONE[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-muted">{label}</p>
        <p className="text-2xl font-bold leading-tight tracking-tight text-text tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  );
}
