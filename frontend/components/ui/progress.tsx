import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/format';

const FILL: Record<Tone, string> = {
  success: 'bg-brand',
  info: 'bg-brand',
  warning: 'bg-brand',
  danger: 'bg-[#e11d2e]',
  neutral: 'bg-slate-400',
};

/** Rounded 10px track, blue fill; red when the sector is full. */
export function Progress({ value, tone = 'info', className }: { value: number; tone?: Tone; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', FILL[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
