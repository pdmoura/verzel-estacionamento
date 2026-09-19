'use client';

import { History, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ReservationHistoryModal } from '@/components/reservation-history-modal';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/cn';
import { EVENT_TONE, eventSentence, formatTime } from '@/lib/format';
import { useHistory } from '@/lib/hooks';
import type { HistoryEventType } from '@/lib/types';

const FILTERS: { label: string; types: HistoryEventType[] }[] = [
  { label: 'Reserva criada', types: ['RESERVATION_CREATED'] },
  { label: 'Cancelamento', types: ['RESERVATION_CANCELLED'] },
  { label: 'Fila', types: ['WAITLIST_JOINED', 'WAITLIST_LEFT'] },
  { label: 'Promoção', types: ['WAITLIST_PROMOTED'] },
];

const TITLE: Record<HistoryEventType, string> = {
  RESERVATION_CREATED: 'Reserva criada',
  RESERVATION_CANCELLED: 'Reserva cancelada',
  WAITLIST_JOINED: 'Entrada na fila',
  WAITLIST_LEFT: 'Saída da fila',
  WAITLIST_PROMOTED: 'Promoção automática',
};

const DOT: Record<string, string> = {
  success: 'bg-[#16a34a]',
  warning: 'bg-[#f59e0b]',
  danger: 'bg-[#e11d2e]',
  info: 'bg-brand',
  neutral: 'bg-slate-400',
};

function HistoryContent() {
  const params = useSearchParams();
  const initial = params.get('reserva');
  const { data: history, error } = useHistory();
  const [filter, setFilter] = useState<number>(-1);
  const [query, setQuery] = useState('');
  const [openReservation, setOpenReservation] = useState<number | null>(initial ? Number(initial) : null);

  const events = useMemo(() => {
    if (!history) return undefined;
    const q = query.trim().toUpperCase();
    const types = filter >= 0 ? FILTERS[filter].types : null;
    return [...history]
      .reverse()
      .filter((e) => (types ? types.includes(e.type) : true))
      .filter((e) => (q ? (e.description + eventSentence(e)).toUpperCase().includes(q) : true));
  }, [history, filter, query]);

  const chip = (active: boolean) =>
    cn(
      'inline-flex h-12 items-center rounded-full border px-6 text-[15px] font-semibold transition-colors',
      active ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-text hover:bg-surface-2',
    );

  return (
    <>
      <PageHeader title="Histórico de eventos" description="Trilha completa de reservas, cancelamentos e movimentações da fila." />

      <div className="mb-8 flex flex-wrap gap-4">
        <button type="button" onClick={() => setFilter(-1)} className={chip(filter === -1)}>
          Todos {history && `(${history.length})`}
        </button>
        {FILTERS.map((f, i) => (
          <button key={f.label} type="button" onClick={() => setFilter(i)} className={chip(filter === i)}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Linha do tempo"
          actions={
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden />
              <Input aria-label="Buscar no histórico" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar placa ou setor" className="h-12 pl-12" />
            </div>
          }
        />
        <CardBody>
          {error && <p className="text-sm text-rose-600">{error.message}</p>}
          {!events && !error && <div className="space-y-4"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
          {events?.length === 0 && <EmptyState icon={<History />} title="Nenhum evento" description={history?.length ? 'Nenhum evento corresponde aos filtros.' : 'As movimentações aparecerão aqui.'} />}
          {events && events.length > 0 && (
            <ol className="relative ml-4 border-l-2 border-[#e2e8f0]">
              {events.map((e) => (
                <li key={e.id} className="relative pl-12 pb-12 last:pb-2">
                  <span className={cn('absolute -left-[17px] top-1 size-8 rounded-full border-4 border-surface', DOT[EVENT_TONE[e.type]])} aria-hidden />
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-lg font-semibold text-text">{TITLE[e.type]}</p>
                      <p className="mt-1 text-muted">{eventSentence(e)}</p>
                      {e.reservationId && (
                        <button type="button" onClick={() => setOpenReservation(e.reservationId as number)} className="mt-2 text-sm font-medium text-brand hover:underline">
                          Ver reserva #{e.reservationId}
                        </button>
                      )}
                    </div>
                    <time dateTime={e.createdAt} className="shrink-0 text-muted tabular-nums">{formatTime(e.createdAt)}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>

      <ReservationHistoryModal reservationId={openReservation} onClose={() => setOpenReservation(null)} />
    </>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <HistoryContent />
    </Suspense>
  );
}
