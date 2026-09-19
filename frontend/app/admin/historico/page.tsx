'use client';

import { History, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ReservationHistoryModal } from '@/components/reservation-history-modal';
import { Timeline } from '@/components/timeline';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/cn';
import { EVENT_LABEL } from '@/lib/format';
import { useHistory } from '@/lib/hooks';
import type { HistoryEventType } from '@/lib/types';

const TYPES = Object.keys(EVENT_LABEL) as HistoryEventType[];

function HistoryContent() {
  const params = useSearchParams();
  const initial = params.get('reserva');
  const { data: history, error } = useHistory();
  const [type, setType] = useState<HistoryEventType | ''>('');
  const [query, setQuery] = useState('');
  const [openReservation, setOpenReservation] = useState<number | null>(initial ? Number(initial) : null);

  const events = useMemo(() => {
    if (!history) return undefined;
    const q = query.trim().toUpperCase();
    return [...history]
      .reverse()
      .filter((e) => (type ? e.type === type : true))
      .filter((e) => (q ? e.description.toUpperCase().includes(q) : true));
  }, [history, type, query]);

  return (
    <>
      <PageHeader title="Histórico de eventos" description="Toda reserva, cancelamento e movimentação da lista de espera fica registrada. Promoções apontam para o cancelamento que as originou." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setType('')} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', type === '' ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-text hover:bg-surface-2')}>
          Todos {history && <span className="opacity-80">({history.length})</span>}
        </button>
        {TYPES.map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', type === t ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-text hover:bg-surface-2')}>
            {EVENT_LABEL[t]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Linha do tempo"
          description={events ? `${events.length} evento(s), mais recentes primeiro` : undefined}
          actions={
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <Input aria-label="Buscar no histórico" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar placa ou setor" className="h-10 pl-9" />
            </div>
          }
        />
        <CardBody>
          {error && <p className="text-sm text-rose-600">{error.message}</p>}
          {!events && !error && <div className="space-y-4"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
          {events?.length === 0 && <EmptyState icon={<History />} title="Nenhum evento" description={history?.length ? 'Nenhum evento corresponde aos filtros.' : 'As movimentações aparecerão aqui.'} />}
          {events && events.length > 0 && <Timeline events={events} onOpenReservation={setOpenReservation} />}
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
