import { CornerDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { EVENT_LABEL, EVENT_TONE, formatDateTime, formatRelative } from '@/lib/format';
import type { HistoryEvent } from '@/lib/types';

const DOT: Record<string, string> = {
  success: 'border-emerald-500',
  warning: 'border-amber-500',
  danger: 'border-rose-500',
  info: 'border-blue-500',
  neutral: 'border-slate-400',
};

export function Timeline({
  events,
  onOpenReservation,
  compact = false,
}: {
  events: HistoryEvent[];
  onOpenReservation?: (id: number) => void;
  compact?: boolean;
}) {
  return (
    <ol className="relative ml-2 border-l-2 border-border">
      {events.map((event) => {
        const tone = EVENT_TONE[event.type] ?? 'neutral';
        return (
          <li key={event.id} className={cn('relative pl-6', compact ? 'pb-4 last:pb-0' : 'pb-6 last:pb-0')}>
            <span
              className={cn('absolute -left-[9px] top-1 size-4 rounded-full border-[3px] bg-surface', DOT[tone])}
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge tone={tone}>{EVENT_LABEL[event.type] ?? event.type}</Badge>
              <time dateTime={event.createdAt} className="text-xs text-muted" title={formatDateTime(event.createdAt)}>
                {formatDateTime(event.createdAt)} · {formatRelative(event.createdAt)}
              </time>
            </div>
            <p className={cn('mt-1.5 text-text', compact ? 'text-sm' : 'text-sm sm:text-[15px]')}>{event.description}</p>
            {event.originEvent && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted">
                <CornerDownRight className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  Originado por: <span className="font-medium text-text/80">{event.originEvent.description}</span>
                </span>
              </p>
            )}
            {onOpenReservation && event.reservationId && (
              <button
                type="button"
                onClick={() => onOpenReservation(event.reservationId as number)}
                className="mt-1.5 text-xs font-semibold text-brand hover:underline"
              >
                Ver reserva #{event.reservationId}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
