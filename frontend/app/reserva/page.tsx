'use client';

import { ArrowLeft, ArrowRight, CarFront, CheckCircle2, Clock3, LayoutGrid, Search, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
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

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-4 text-xl font-bold text-text">
      <span className="flex size-10 items-center justify-center rounded-full bg-brand text-base font-bold text-white">{n}</span>
      {children}
    </h2>
  );
}

function SectorPicker({ sectors, value, onChange }: { sectors: Sector[] | undefined; value: number | null; onChange: (id: number) => void }) {
  // grid-cols-1 is explicit on purpose: an implicit `auto` track would grow to the cards'
  // max-content width (location text + badge) and overflow narrow phones.
  if (!sectors) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl bg-white/70" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5" role="radiogroup" aria-label="Setor">
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
              'w-full min-w-0 rounded-2xl border bg-surface p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors sm:p-6',
              active ? 'border-brand ring-4 ring-brand/15' : 'border-border hover:border-brand/50',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold text-text sm:text-xl">{s.name}</p>
                {s.location && <p className="mt-1 truncate text-sm text-muted sm:text-base">{s.location}</p>}
              </div>
              {full ? <Badge tone="danger" dot className="shrink-0">Lotado</Badge> : <Badge tone="success" dot className="shrink-0">{s.availableSpots} livre{s.availableSpots > 1 ? 's' : ''}</Badge>}
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted sm:mt-5 sm:text-base">
              <span className="text-base font-bold text-text sm:text-lg">{formatMoney(s.hourlyRate)}/h</span>
              <span aria-hidden>•</span>
              <span>{s.reservableQuota} vagas na cota</span>
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
        <CardBody className="pt-8 text-center">
          <span className={cn('mx-auto flex size-16 items-center justify-center rounded-full', ok ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fef3c7] text-[#d97706]')}>
            {ok ? <CheckCircle2 className="size-8" /> : <Clock3 className="size-8" />}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-text">{ok ? 'Vaga reservada!' : 'Você está na lista de espera'}</h2>
          <p className="mt-2 text-muted">{ok ? 'Apresente a placa na entrada do setor. Guarde o número da reserva.' : 'Assim que uma vaga vagar neste setor, a primeira placa da fila é promovida automaticamente.'}</p>
          <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-4 text-left">
            <div className="rounded-xl bg-surface-2 p-4"><dt className="text-sm text-muted">Placa</dt><dd className="text-xl font-bold tracking-wide">{ok ? outcome.reservation.plate : outcome.entry.plate}</dd></div>
            <div className="rounded-xl bg-surface-2 p-4"><dt className="text-sm text-muted">{ok ? 'Reserva' : 'Fila'}</dt><dd className="text-xl font-bold">#{ok ? outcome.reservation.id : outcome.entry.id}</dd></div>
            <div className="rounded-xl bg-surface-2 p-4"><dt className="text-sm text-muted">Setor</dt><dd className="font-semibold">{ok ? outcome.reservation.sector.name : outcome.sector.name}</dd></div>
            <div className="rounded-xl bg-surface-2 p-4"><dt className="text-sm text-muted">Chegada</dt><dd className="font-semibold">{formatDateTime(ok ? outcome.reservation.expectedArrival : outcome.entry.expectedArrival)}</dd></div>
          </dl>
          <Button className="mt-8" size="lg" variant="outline" onClick={reset}>Fazer outra reserva</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8 sm:space-y-10">
      <div>
        <StepTitle n={1}>Escolha o setor</StepTitle>
        <SectorPicker sectors={sectors} value={sectorId} onChange={(id) => { setSectorId(id); setOfferWaitlist(false); }} />
      </div>

      <div>
        <StepTitle n={2}>Seus dados</StepTitle>
        <Card>
          <CardBody className="grid grid-cols-1 gap-5 px-5 pt-5 pb-5 sm:grid-cols-2 sm:gap-6 sm:px-6 sm:pt-6 sm:pb-6">
            <Field label="Placa do veículo" htmlFor="drv-plate">
              <Input id="drv-plate" value={plate} onChange={(e) => setPlate(normalizePlateInput(e.target.value))} placeholder="ABC1D23" required minLength={7} maxLength={7} autoCapitalize="characters" className="h-14 text-xl font-bold uppercase tracking-wide" />
            </Field>
            <Field label="Previsão de chegada" htmlFor="drv-arrival">
              <Input id="drv-arrival" type="datetime-local" value={arrival} min={nowLocalInputValue()} onChange={(e) => setArrival(e.target.value)} required className="h-14 text-lg" />
            </Field>
          </CardBody>
        </Card>
      </div>

      {offerWaitlist ? (
        <div className="rounded-2xl border border-amber-300/60 bg-[#fef3c7] p-6 text-[#78350f]">
          <p className="text-lg font-bold">O {selected?.name} está lotado no momento.</p>
          <p className="mt-1">Entre na lista de espera: quando uma reserva for cancelada, a primeira placa da fila recebe a vaga automaticamente.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="button" size="lg" onClick={join} loading={submitting} icon={<Clock3 className="size-5" strokeWidth={1.75} />}>Entrar na lista de espera</Button>
            <Button type="button" size="lg" variant="outline" onClick={() => setOfferWaitlist(false)} disabled={submitting}>Escolher outro setor</Button>
          </div>
        </div>
      ) : (
        <Button type="submit" size="lg" className="h-14 w-full min-w-0 justify-between px-5 text-base sm:h-16 sm:px-8 sm:text-lg" loading={submitting} disabled={!sectorId}>
          <span className="flex min-w-0 items-center gap-3">
            <CarFront className="size-6 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate sm:hidden">{selected ? `Reservar no ${selected.name}` : 'Escolha um setor'}</span>
            <span className="hidden sm:inline">{selected ? `Reservar vaga no ${selected.name}` : 'Escolha um setor para continuar'}</span>
          </span>
          <ArrowRight className="size-6 shrink-0" strokeWidth={1.75} aria-hidden />
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
    <div className="space-y-6">
      <Card>
        <CardBody className="pt-6">
          <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
            <Input aria-label="Placa" value={plate} onChange={(e) => setPlate(normalizePlateInput(e.target.value))} placeholder="Digite a placa" minLength={3} maxLength={7} className="h-14 text-xl font-bold uppercase tracking-wide" />
            <Button type="submit" size="lg" className="h-14 px-8" loading={loading} icon={<Search className="size-5" strokeWidth={1.75} />}>Consultar</Button>
          </form>
        </CardBody>
      </Card>

      {results && (
        <>
          {active ? (
            <Card className="border-[#86efac]">
              <CardBody className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Badge tone="success" dot>Reserva ativa</Badge>
                    <p className="mt-3 text-lg font-bold text-text sm:text-xl">{active.sector.name} · reserva #{active.id}</p>
                    <p className="mt-1 text-muted">Chegada prevista: {formatDateTime(active.expectedArrival)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 border border-rose-200 bg-[#fee2e2] text-[#dc2626] hover:bg-rose-100 hover:text-[#b91c1c]" onClick={() => setCancelTarget(active)} icon={<XCircle className="size-4" strokeWidth={1.75} />}>Cancelar</Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card><CardBody className="pt-6 text-muted">Nenhuma reserva ativa para <span className="font-bold text-text">{plate}</span>.</CardBody></Card>
          )}

          {waiting.length > 0 && (
            <Card className="border-amber-300/60">
              <CardBody className="pt-6">
                <Badge tone="warning" dot>Na lista de espera</Badge>
                <ul className="mt-3 space-y-1">
                  {waiting.map((w) => (
                    <li key={w.id} className="text-text">{w.sector?.name ?? `Setor #${w.sectorId}`} · chegada {formatDateTime(w.expectedArrival)}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {results.length > 0 && (
            <Card>
              <CardBody className="pt-6">
                <h3 className="mb-3 text-lg font-bold text-text">Histórico da placa</h3>
                <ul className="divide-y divide-border">
                  {results.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold text-text">{r.sector.name} · #{r.id}</p>
                        <p className="text-sm text-muted">{formatDateTime(r.createdAt)}</p>
                      </div>
                      <Badge tone={RESERVATION_TONE[r.status]} dot>{RESERVATION_STATUS_LABEL[r.status]}</Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog open={cancelTarget !== null} onClose={() => setCancelTarget(null)} onConfirm={confirmCancel} loading={cancelling} title="Cancelar sua reserva?" description={`A vaga no ${cancelTarget?.sector.name ?? 'setor'} será liberada para a próxima placa da fila.`} confirmLabel="Cancelar reserva" />
    </div>
  );
}

function Portal() {
  const params = useSearchParams();
  const [tab, setTab] = useState<'reserve' | 'lookup'>(params.get('tab') === 'consultar' ? 'lookup' : 'reserve');

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-20 sm:px-6">
          {/* Side links are round icon buttons on phones and icon + label from tablet up. */}
          <Link href="/" className="inline-flex size-10 items-center justify-center gap-2 justify-self-start rounded-full bg-surface-2 text-text transition-colors hover:bg-border/70 sm:size-auto sm:rounded-none sm:bg-transparent sm:text-muted sm:hover:bg-transparent sm:hover:text-text" aria-label="Início">
            <ArrowLeft className="size-5" strokeWidth={1.75} aria-hidden /> <span className="hidden sm:inline">Início</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <Image src="/logo.png" alt="" width={56} height={56} className="size-10 rounded-xl sm:size-14 sm:rounded-2xl" priority />
            <span className="leading-tight">
              <span className="block text-lg font-bold text-brand sm:text-2xl">Praça Central</span>
              <span className="block text-[10px] font-semibold tracking-[0.2em] text-brand sm:text-sm">ESTACIONAMENTO</span>
            </span>
          </Link>
          <Link href="/admin" className="inline-flex size-10 items-center justify-center gap-2 justify-self-end rounded-full bg-surface-2 text-text transition-colors hover:bg-border/70 sm:size-auto sm:rounded-none sm:bg-transparent sm:text-muted sm:hover:bg-transparent sm:hover:text-text" aria-label="Painel de gestão">
            <LayoutGrid className="size-5" strokeWidth={1.75} aria-hidden /> <span className="hidden md:inline">Painel de gestão</span>
          </Link>
        </div>
      </header>

      <main className="portal-bg relative flex-1">
        {/* On phones the backdrop gets an uncovered band under the form (pb-[56vw]) so the car is visible. */}
        <div className="mx-auto max-w-[960px] px-4 pt-8 pb-[56vw] sm:px-6 md:py-12">
          <div className="text-center sm:text-left">
            <h1 className="text-[2rem] leading-tight font-bold tracking-tight text-text sm:text-5xl">Reserve sua vaga</h1>
            <p className="mx-auto mt-2 max-w-sm text-base text-muted sm:mx-0 sm:mt-3 sm:max-w-none sm:text-xl">Sem cadastro. Escolha um setor e informe sua placa.</p>
          </div>

          {/* Segmented control on phones (full width, centered); two standalone buttons from tablet up. */}
          <div className="mt-6 mb-8 grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface p-1.5 sm:mt-8 sm:mb-10 sm:inline-flex sm:gap-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0" role="tablist">
            {(
              [
                { key: 'reserve', label: 'Reservar vaga', icon: <CarFront className="size-5 shrink-0" strokeWidth={1.75} aria-hidden /> },
                { key: 'lookup', label: 'Consultar placa', icon: <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden /> },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'inline-flex h-12 items-center justify-center gap-2 rounded-xl px-3 text-[15px] font-semibold whitespace-nowrap transition-colors sm:h-14 sm:gap-3 sm:px-8 sm:text-lg',
                  tab === t.key ? 'bg-brand text-white shadow-sm shadow-blue-950/10' : 'text-muted hover:text-text sm:border sm:border-border sm:bg-surface sm:text-text sm:hover:bg-surface-2',
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === 'reserve' ? <ReserveTab /> : <LookupTab />}
        </div>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-4 py-6 text-center text-sm text-muted sm:px-6 md:flex-row md:justify-between md:text-left">
          <span className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={40} height={40} className="size-10 rounded-xl" />
            <span className="leading-tight">
              <span className="block text-base font-bold text-brand">Praça Central</span>
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-brand">ESTACIONAMENTO</span>
            </span>
          </span>
          <p>Mais mobilidade para uma cidade melhor.</p>
          <p className="flex gap-4">
            <a href="#" className="hover:text-text">Termos de uso</a>
            <span aria-hidden>|</span>
            <a href="#" className="hover:text-text">Privacidade</a>
            <span aria-hidden>|</span>
            <a href="#" className="hover:text-text">Suporte</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function DriverPortalPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40" />}>
      <Portal />
    </Suspense>
  );
}
