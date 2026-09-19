import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/format';

const TONE: Record<Tone, string> = {
  success: 'bg-[#dcfce7] text-[#15803d]',
  warning: 'bg-[#fef3c7] text-[#b45309]',
  danger: 'bg-[#fee2e2] text-[#dc2626]',
  info: 'bg-brand-soft text-brand',
  neutral: 'bg-surface-2 text-muted',
};

const DOT: Record<Tone, string> = {
  success: 'bg-[#16a34a]',
  warning: 'bg-[#f59e0b]',
  danger: 'bg-[#e11d2e]',
  info: 'bg-brand',
  neutral: 'bg-muted',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-2 rounded-full', DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}
