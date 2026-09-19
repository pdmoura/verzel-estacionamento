'use client';

import { ArrowLeft, CalendarCheck2, CheckCircle2, Hourglass, Search, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { ConfirmDialog } from '@/components/ui/modal';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { RESERVATION_STATUS_LABEL, RESERVATION_TONE, formatDateTime, formatMoney, localToIso, normalizePlateInput, nowLocalInputValue } from '@/lib/format';
import { useSectors } from '@/lib/hooks';
import type { Reservation, Sector, WaitlistEntry } from '@/lib/types';

type Outcome = { kind: 'reservation'; reservation: Reservation } | { kind: 'waitlist'; entry: WaitlistEntry; sector: Sector };

function SectorPicker({ sectors, value, onChange }: { sectors: Sector[] | undefined; value: number | null; onChange: (id: number) => void }) {
  if (!sectors) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Setor">
      {sectors.map((s) => {
        const full = s.availableSpots === 0;
        const active = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.id)}
            className={cn(
              'rounded-2xl border p-4 text-left transition-all focus-visible:ring-4 focus-visible:ring-brand/30',
              active ? 'border-brand bg-brand-soft/60 shadow-md shadow-brand/10 dark:bg-brand-soft/30' : 'border-border bg-surface hover:border-brand/50 hover:bg-surface-2/60',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-text">{s.name}</p>
                {s.location && <p className="truncate text-xs text-muted">{s.location}</p>}
              </div>
              {full ? <Badge tone="danger">Lotado</Badge> : <Badge tone="success">{s.availableSpots} livre{s.availableSpots > 1 ? 's' : ''}</Badge>}
            </div>
            <p className="mt-3 text-sm text-muted">
              <span className="font-semibold text-text">{formatMoney(s.hourlyRate)}</span> / hora · {s.reservableQuota} vagas
            </p>
          </button>
        );
      })}
    </div>
  );
}

function ReserveTab() {
  const { data: sectors } = useSectors();
  const { mutate } = useSWRConfig();
  const [sectorId, setSectorId] = useState<number | null>(null);
  const [plate, setPlate] = useState('');
  const [arrival, setArrival] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [offerWaitlist, setOfferWaitlist] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const selected = sectors?.find((s) => s.id === sectorId) ?? null;

  function reset() {
    setOutcome(null);
    setOfferWaitlist(false);
    setPlate('');
    setArrival('');
    setSectorId(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!sectorId) {
      toast.error('Escolha um setor.');
      return;
    }
    setSubmitting(true);
    try {
      const reservation = await api.createReservation({ plate, sectorId, expectedArrival: localToIso(arrival) });
      setOutcome({ kind: 'reservation', reservation });
      await mutate('sectors');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NO_SPOTS') setOfferWaitlist(true);
      else toast.error(err instanceof Error ? err.message : 'Erro ao reservar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function join() {
    if (!sectorId || !selected) return;
    setSubmitting(true);
    try {
      const entry = await api.joinWaitlist(sectorId, { plate, expectedArrival: localToIso(arrival) });
      setOutcome({ kind: 'waitlist', entry, sector: selected });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar na lista de espera.');
    } finally {
      setSubmitting(false);
    }
  }

  if (outcome) {
    const ok = outcome.kind === 'reservation';
    return (
      <Card>
        <CardBody className="text-center">
          <span className={cn('mx-auto flex size-16 items-center justify-center rounded-full', ok ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300')}>
            {ok ? <CheckCircle2 className="size-8" /> : <Hourglass className="size-8" />}
          </span>
          <h2 className="mt-4 text-xl font-bold text-text">{ok ? 'Vaga reservada!' : 'Você está na lista de espera'}</h2>
          <p className="mt-1 text-sm text-muted">
            {ok ? 'Apresente a placa na entrada do setor. Guarde o número da reserva.' : 'Assim que uma vaga vagar neste setor, a primeira placa da fila é promovida automaticamente.'}
          </p>
          <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-left text-sm">
            <div className="rounded-xl bg-surface-2 p-3"><dt className="text-xs text-muted">Placa</dt><dd className="font-mono text-lg font-bold tracking-wider">{ok ? outcome.reservation.plate : outcome.entry.plate}</dd></div>
            <div className="rounded-xl bg-surface-2 p-3"><dt className="text-xs text-muted">{ok ? 'Reserva' : 'Fila'}</dt><dd className="text-lg font-bold">#{ok ? outcome.reservation.id : outcome.entry.id}</dd></div>
            <div className="rounded-xl bg-surface-2 p-3"><dt className="text-xs text-muted">Setor</dt><dd className="font-semibold">{ok ? outcome.reservation.sector.name : outcome.sector.name}</dd></div>
            <div className="rounded-xl bg-surface-2 p-3"><dt className="text-xs text-muted">Chegada</dt><dd className="font-semibold">{formatDateTime(ok ? outcome.reservation.expectedArrival : outcome.entry.expectedArrival)}</dd></div>
          </dl>
          <Button className="mt-6" variant="outline" onClick={reset}>Fazer outra reserva</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">1. Escolha o setor</h2>
        <SectorPicker sectors={sectors} value={sectorId} onChange={(id) => { setSectorId(id); setOfferWaitlist(false); }} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">2. Seus dados</h2>
        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Placa do veículo" htmlFor="drv-plate" hint="Formato antigo (ABC1234) ou Mercosul (ABC1D23).">
              <Input id="drv-plate" value={plate} onChange={(e) => setPlate(normalizePlateInput(e.target.value))} placeholder="ABC1D23" required minLength={7} maxLength={7} autoCapitalize="characters" className="h-12 font-mono text-lg uppercase tracking-[0.25em]" />
            </Field>
            <Field label="Previsão de chegada" htmlFor="drv-arrival">
              <Input id="drv-arrival" type="datetime-local" value={arrival} min={nowLocalInputValue()} onChange={(e) => setArrival(e.target.value)} required className="h-12" />
            </Field>
          </CardBody>
        </Card>
      </div>

      {offerWaitlist ? (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-semibold">O {selected?.name} está lotado no momento.</p>
          <p className="mt-1 text-sm">Entre na lista de espera: quando uma reserva for cancelada, a primeira placa da fila recebe a vaga automaticamente.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="button" size="lg" onClick={join} loading={submitting} icon={<Hourglass className="size-5" />}>Entrar na lista de espera</Button>
            <Button type="button" size="lg" variant="outline" onClick={() => setOfferWaitlist(false)} disabled={submitting}>Escolher outro setor</Button>
          </div>
        </div>
      ) : (
        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!sectorId} icon={<CalendarCheck2 className="size-5" />}>
          {selected ? `Reservar vaga no ${selected.name}` : 'Escolha um setor para continuar'}
        </Button>
      )}
    </form>
  );
}

function LookupTab() {
  const { mutate } = useSWRConfig();
  const [plate, setPlate] = useState('');
  const [results, setResults] = useState<Reservation[] | null>(null);
  const [waiting, setWaiting] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function search(e?: FormEvent) {
    e?.preventDefault();
    if (plate.length < 3) return;
    setLoading(true);
    try {
      const [reservations, all] = await Promise.all([api.getReservations({ plate }), api.getAllWaitlist()]);
      setResults(reservations.filter((r) => r.plate === plate));
      setWaiting(all.filter((w) => w.plate === plate));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao consultar.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.cancelReservation(cancelTarget.id);
      toast.success('Reserva cancelada.');
      setCancelTarget(null);
      await mutate('sectors');
      await search();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar.');
    } finally {
      setCancelling(false);
    }
  }

  const active = results?.find((r) => r.status === 'ACTIVE');

  return (
    <div className="space-y-5">
      <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
        <Input aria-label="Placa" value={plate} onChange={(e) => setPlate(normalizePlateInput(e.target.value))} placeholder="Digite a placa" minLength={3} maxLength={7} className="h-12 font-mono text-lg uppercase tracking-[0.25em]" />
        <Button type="submit" size="lg" loading={loading} icon={<Search className="size-5" />}>Consultar</Button>
      </form>

      {results && (
        <>
          {active ? (
            <Card className="border-emerald-300/60 dark:border-emerald-500/30">
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone="success" dot>Reserva ativa</Badge>
                    <p className="mt-2 text-lg font-bold text-text">{active.sector.name} · reserva #{active.id}</p>
                    <p className="text-sm text-muted">Chegada prevista: {formatDateTime(active.expectedArrival)}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCancelTarget(active)} icon={<XCircle className="size-4" />}>Cancelar</Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card><CardBody className="text-sm text-muted">Nenhuma reserva ativa para <span className="font-mono font-semibold text-text">{plate}</span>.</CardBody></Card>
          )}

          {waiting.length > 0 && (
            <Card className="border-amber-300/60 dark:border-amber-500/30">
              <CardBody>
                <Badge tone="warning" dot>Na lista de espera</Badge>
                <ul className="mt-2 space-y-1 text-sm">
                  {waiting.map((w) => (
                    <li key={w.id} className="text-text">{w.sector?.name ?? `Setor #${w.sectorId}`} · chegada {formatDateTime(w.expectedArrival)}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {results.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Histórico da placa</h3>
              <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
                {results.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-text">{r.sector.name} · #{r.id}</p>
                      <p className="text-xs text-muted">{formatDateTime(r.createdAt)}</p>
                    </div>
                    <Badge tone={RESERVATION_TONE[r.status]}>{RESERVATION_STATUS_LABEL[r.status]}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <ConfirmDialog open={cancelTarget !== null} onClose={() => setCancelTarget(null)} onConfirm={confirmCancel} loading={cancelling} title="Cancelar sua reserva?" description={`A vaga no ${cancelTarget?.sector.name ?? 'setor'} será liberada para a próxima placa da fila.`} confirmLabel="Cancelar reserva" />
    </div>
  );
}

export default function DriverPortalPage() {
  const [tab, setTab] = useState<'reserve' | 'lookup'>('reserve');

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-text">
            <ArrowLeft className="size-4" /> Início
          </Link>
          <Link href="/admin" className="text-sm font-medium text-muted hover:text-text">Painel de gestão</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <Image src="/logo.png" alt="" width={64} height={64} className="mx-auto size-16 rounded-2xl shadow-lg shadow-brand/30" priority />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-text">Portal do motorista</h1>
          <p className="mt-2 text-muted">Estacionamento rotativo · Praça Central</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl border border-border bg-surface p-1" role="tablist">
          {([
            ['reserve', 'Reservar vaga'],
            ['lookup', 'Minha reserva'],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={cn('h-11 rounded-xl text-sm font-semibold transition-colors', tab === key ? 'bg-brand text-white shadow-md shadow-brand/30' : 'text-muted hover:text-text')}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'reserve' ? <ReserveTab /> : <LookupTab />}
      </main>
    </div>
  );
}
