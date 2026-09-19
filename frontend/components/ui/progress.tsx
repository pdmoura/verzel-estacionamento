import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/format';

const FILL: Record<Tone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
};

export function Progress({ value, tone = 'success', className }: { value: number; tone?: Tone; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', FILL[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
