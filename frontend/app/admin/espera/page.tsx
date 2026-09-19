'use client';

import { Hourglass, LogOut, UserPlus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveTable, type Column } from '@/components/ui/responsive-table';
import * as api from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelative, localToIso, normalizePlateInput, nowLocalInputValue } from '@/lib/format';
import { useAllWaitlist, useSectors, useWaitlist } from '@/lib/hooks';
import type { WaitlistEntry } from '@/lib/types';

export default function WaitlistPage() {
  const { mutate } = useSWRConfig();
  const { data: sectors } = useSectors();
  const { data: all } = useAllWaitlist();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: queue } = useWaitlist(selectedId);

  const [plate, setPlate] = useState('');
  const [arrival, setArrival] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<WaitlistEntry | null>(null);
  const [leaving, setLeaving] = useState(false);

  const selected = sectors?.find((s) => s.id === selectedId) ?? null;
  const countBySector = useMemo(() => {
    const map = new Map<number, number>();
    all?.forEach((e) => map.set(e.sectorId, (map.get(e.sectorId) ?? 0) + 1));
    return map;
  }, [all]);

  async function refresh() {
    await mutate((key) => key === 'waitlist' || (Array.isArray(key) && key[0] === 'waitlist') || key === 'sectors' || key === 'history');
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const entry = await api.joinWaitlist(selectedId, { plate, expectedArrival: localToIso(arrival) });
      toast.success(`${entry.plate} entrou na fila do ${selected?.name}.`);
      setPlate('');
      setArrival('');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar na lista de espera.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmLeave() {
    if (!leaveTarget) return;
    setLeaving(true);
    try {
      await api.leaveWaitlist(leaveTarget.id);
      toast.success(`${leaveTarget.plate} saiu da lista de espera.`);
      await refresh();
      setLeaveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sair da lista de espera.');
    } finally {
      setLeaving(false);
    }
  }

  const queueColumns: Column<WaitlistEntry & { position: number }>[] = [
    {
      key: 'plate',
      header: 'Placa',
      primary: true,
      cell: (e) => (
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">{e.position}º</span>
          <span className="font-mono text-base font-semibold tracking-wider">{e.plate}</span>
        </div>
      ),
    },
    { key: 'arrival', header: 'Chegada prevista', cell: (e) => formatDateTime(e.expectedArrival) },
    { key: 'joined', header: 'Entrou', cell: (e) => <span className="text-muted">{formatRelative(e.createdAt)}</span> },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      cell: (e) => (
        <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10" onClick={() => setLeaveTarget(e)} icon={<LogOut className="size-4" />}>
          Remover
        </Button>
      ),
    },
  ];

  const allColumns: Column<WaitlistEntry>[] = [
    { key: 'plate', header: 'Placa', primary: true, cell: (e) => <span className="font-mono text-base font-semibold tracking-wider">{e.plate}</span> },
    { key: 'sector', header: 'Setor', cell: (e) => e.sector?.name ?? `#${e.sectorId}` },
    { key: 'arrival', header: 'Chegada prevista', cell: (e) => formatDateTime(e.expectedArrival) },
    { key: 'joined', header: 'Entrou', cell: (e) => <span className="text-muted">{formatRelative(e.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader title="Lista de espera" description="Só é possível entrar na fila de um setor lotado. Quando uma reserva é cancelada, a primeira placa da fila (FIFO) é promovida automaticamente." />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Setores">
        <button
          type="button"
          role="tab"
          aria-selected={selectedId === null}
          onClick={() => setSelectedId(null)}
          className={cn('rounded-full border px-4 py-2 text-sm font-medium transition-colors', selectedId === null ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-text hover:bg-surface-2')}
        >
          Todas as filas {all && <span className="ml-1 opacity-80">({all.length})</span>}
        </button>
        {!sectors && <Skeleton className="h-10 w-32 rounded-full" />}
        {sectors?.map((s) => {
          const n = countBySector.get(s.id) ?? 0;
          const active = selectedId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedId(s.id)}
              className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors', active ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-text hover:bg-surface-2')}
            >
              {s.name}
              {s.availableSpots === 0 ? <Badge tone={active ? 'neutral' : 'danger'} className={active ? 'bg-white/20 text-white' : ''}>Lotado</Badge> : null}
              {n > 0 && <span className={cn('rounded-full px-1.5 text-xs font-bold', active ? 'bg-white/20' : 'bg-surface-2 text-muted')}>{n}</span>}
            </button>
          );
        })}
      </div>

      {selectedId === null ? (
        <Card>
          <CardHeader title="Todas as placas aguardando" description="Ordem de chegada dentro de cada setor." />
          {!all && <div className="space-y-3 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
          {all?.length === 0 && <EmptyState icon={<Hourglass />} title="Nenhuma placa na fila" description="As filas só recebem placas quando um setor está lotado." />}
          {all && all.length > 0 && <ResponsiveTable columns={allColumns} rows={all} rowKey={(e) => e.id} />}
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader title={`Entrar na fila · ${selected?.name ?? ''}`} description={selected && selected.availableSpots > 0 ? `Este setor ainda tem ${selected.availableSpots} vaga(s): faça uma reserva direta.` : 'Setor lotado: a placa entra no fim da fila.'} />
            <CardBody>
              <form onSubmit={handleJoin} className="grid gap-4">
                <Field label="Placa" htmlFor="wl-plate">
                  <Input id="wl-plate" value={plate} onChange={(e) => setPlate(normalizePlateInput(e.target.value))} placeholder="ABC1D23" required minLength={7} maxLength={7} className="font-mono uppercase tracking-[0.2em]" disabled={!!selected && selected.availableSpots > 0} />
                </Field>
                <Field label="Chegada prevista" htmlFor="wl-arrival">
                  <Input id="wl-arrival" type="datetime-local" value={arrival} min={nowLocalInputValue()} onChange={(e) => setArrival(e.target.value)} required disabled={!!selected && selected.availableSpots > 0} />
                </Field>
                <Button type="submit" loading={submitting} disabled={!!selected && selected.availableSpots > 0} icon={<UserPlus className="size-4" />}>
                  Entrar na lista de espera
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader title={`Fila do ${selected?.name ?? 'setor'}`} description={queue ? `${queue.length} placa(s) aguardando` : undefined} />
            {!queue && <div className="space-y-3 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
            {queue?.length === 0 && <EmptyState icon={<Hourglass />} title="Fila vazia" description="Nenhuma placa aguardando neste setor." />}
            {queue && queue.length > 0 && (
              <ResponsiveTable columns={queueColumns} rows={queue.map((e, i) => ({ ...e, position: i + 1 }))} rowKey={(e) => e.id} />
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={leaveTarget !== null}
        onClose={() => setLeaveTarget(null)}
        onConfirm={confirmLeave}
        loading={leaving}
        title="Remover da lista de espera?"
        description={`A placa ${leaveTarget?.plate ?? ''} perderá a posição na fila.`}
        confirmLabel="Remover"
      />
    </>
  );
}
