import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './card';

const TONE = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-[#dcfce7] text-[#15803d]',
  warning: 'bg-[#fef3c7] text-[#d97706]',
  violet: 'bg-brand-soft text-brand',
} as const;

/** Icon square with the label beside it, then the number and a hint, as in the mockup. */
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
    <Card className={cn('p-5', className)}>
      <div className="flex items-center gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5', TONE[tone])}>{icon}</span>
        <span className="text-base font-medium text-text">{label}</span>
      </div>
      <p className="mt-4 text-4xl font-bold leading-none tracking-tight text-text tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-base text-muted">{hint}</p>}
    </Card>
  );
}
