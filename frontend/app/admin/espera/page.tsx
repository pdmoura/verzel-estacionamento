'use client';

import { Clock3, LogOut, UserPlus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveTable, type Column } from '@/components/ui/responsive-table';
import * as api from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatArrival, formatRelative, localToIso, normalizePlateInput, nowLocalInputValue } from '@/lib/format';
import { useAllWaitlist, useSectors, useWaitlist } from '@/lib/hooks';
import type { WaitlistEntry } from '@/lib/types';

function Position({ n }: { n: number }) {
  return <span className="flex size-10 items-center justify-center rounded-full bg-[#fef3c7] text-base font-bold text-[#d97706]">{n}</span>;
}

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

  const allColumns: Column<WaitlistEntry & { position: number }>[] = [
    {
      key: 'plate',
      header: 'Placa',
      primary: true,
      cell: (e) => (
        <span className="flex items-center gap-4">
          <Position n={e.position} />
          <span className="text-lg font-bold tracking-wide text-text">{e.plate}</span>
        </span>
      ),
    },
    { key: 'sector', header: 'Setor', cell: (e) => e.sector?.name ?? selected?.name ?? `#${e.sectorId}` },
    { key: 'arrival', header: 'Chegada prevista', cell: (e) => formatArrival(e.expectedArrival) },
    { key: 'joined', header: 'Entrou', cell: (e) => <span className="text-muted">{formatRelative(e.createdAt)}</span> },
  ];

  const queueColumns: Column<WaitlistEntry & { position: number }>[] = [
    ...allColumns,
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      cell: (e) => (
        <Button variant="ghost" size="sm" className="border border-rose-200 bg-[#fee2e2] text-[#dc2626] hover:bg-rose-100 hover:text-[#b91c1c]" onClick={() => setLeaveTarget(e)} icon={<LogOut className="size-4" strokeWidth={1.75} />}>
          Remover
        </Button>
      ),
    },
  ];

  const chip = (active: boolean) =>
    cn(
      'inline-flex h-12 items-center gap-2 rounded-full border px-6 text-[15px] font-semibold transition-colors',
      active ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-text hover:bg-surface-2',
    );

  return (
    <>
      <PageHeader title="Lista de espera" description="Fila FIFO por setor, com promoção automática quando uma vaga é liberada." />

      <div className="mb-8 flex flex-wrap gap-4" role="tablist" aria-label="Setores">
        <button type="button" role="tab" aria-selected={selectedId === null} onClick={() => setSelectedId(null)} className={chip(selectedId === null)}>
          Todas as filas {all && `(${all.length})`}
        </button>
        {!sectors && <Skeleton className="h-12 w-40 rounded-full" />}
        {sectors?.map((s) => {
          const n = countBySector.get(s.id) ?? 0;
          return (
            <button key={s.id} type="button" role="tab" aria-selected={selectedId === s.id} onClick={() => setSelectedId(s.id)} className={chip(selectedId === s.id)}>
              {s.name}
              {s.availableSpots === 0 && ' · Lotado'}
              {n > 0 && ` (${n})`}
            </button>
          );
        })}
      </div>

      {selectedId === null ? (
        <Card>
          <CardHeader title="Todas as placas aguardando" />
          {!all && <div className="space-y-3 px-6 pb-6"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
          {all?.length === 0 && <EmptyState icon={<Clock3 />} title="Nenhuma placa na fila" description="As filas só recebem placas quando um setor está lotado." />}
          {all && all.length > 0 && <ResponsiveTable columns={allColumns} rows={all.map((e, i) => ({ ...e, position: i + 1 }))} rowKey={(e) => e.id} />}
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader title={`Entrar na fila · ${selected?.name ?? ''}`} description={selected && selected.availableSpots > 0 ? `Este setor ainda tem ${selected.availableSpots} vaga(s): faça uma reserva direta.` : 'Setor lotado: a placa entra no fim da fila.'} />
            <CardBody>
              <form onSubmit={handleJoin} className="grid gap-4">
                <Field label="Placa" htmlFor="wl-plate">
                  <Input id="wl-plate" value={plate} onChange={(e) => setPlate(normalizePlateInput(e.target.value))} placeholder="ABC1D23" required minLength={7} maxLength={7} className="font-bold uppercase tracking-wide" disabled={!!selected && selected.availableSpots > 0} />
                </Field>
                <Field label="Chegada prevista" htmlFor="wl-arrival">
                  <Input id="wl-arrival" type="datetime-local" value={arrival} min={nowLocalInputValue()} onChange={(e) => setArrival(e.target.value)} required disabled={!!selected && selected.availableSpots > 0} />
                </Field>
                <Button type="submit" loading={submitting} disabled={!!selected && selected.availableSpots > 0} icon={<UserPlus className="size-4" strokeWidth={1.75} />}>
                  Entrar na lista de espera
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader title={`Fila do ${selected?.name ?? 'setor'}`} description={queue ? `${queue.length} placa(s) aguardando` : undefined} />
            {!queue && <div className="space-y-3 px-6 pb-6"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
            {queue?.length === 0 && <EmptyState icon={<Clock3 />} title="Fila vazia" description="Nenhuma placa aguardando neste setor." />}
            {queue && queue.length > 0 && <ResponsiveTable columns={queueColumns} rows={queue.map((e, i) => ({ ...e, position: i + 1 }))} rowKey={(e) => e.id} />}
          </Card>
        </div>
      )}

      <ConfirmDialog open={leaveTarget !== null} onClose={() => setLeaveTarget(null)} onConfirm={confirmLeave} loading={leaving} title="Remover da lista de espera?" description={`A placa ${leaveTarget?.plate ?? ''} perderá a posição na fila.`} confirmLabel="Remover" />
    </>
  );
}
