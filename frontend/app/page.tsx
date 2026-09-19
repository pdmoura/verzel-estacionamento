'use client';

import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ApiStatus } from '@/components/admin/sidebar';
import { Card, CardBody } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { occupancy } from '@/lib/format';
import { useRanking, useSectors } from '@/lib/hooks';

const STEPS = [
  ['Escolha o setor', 'Veja disponibilidade e tarifa em tempo real.'],
  ['Informe placa e chegada', 'Validação simples, sem cadastro.'],
  ['Confirme', 'Se lotar, você pode entrar na fila automaticamente.'],
];

const REASONS = ['Uma placa, uma reserva ativa', 'Fila FIFO quando o setor lota', 'Promoção automática no cancelamento', 'Histórico rastreável de eventos'];

function LiveSpots() {
  const { data: sectors } = useSectors();
  return (
    <Card>
      <CardBody className="pt-6">
        <h2 className="text-xl font-bold text-text">Vagas agora</h2>
        <div className="mt-5 space-y-5">
          {!sectors && [1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
          {sectors?.map((s) => {
            const o = occupancy(s);
            return (
              <div key={s.id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-lg font-semibold text-text">{s.name}</span>
                  <span className="text-muted tabular-nums">{s.availableSpots}/{s.reservableQuota} livres</span>
                </div>
                <Progress value={o.rate} tone={o.tone} />
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function RankingCard() {
  const { data: ranking } = useRanking();
  const max = ranking?.[0]?.totalReservations ?? 0;
  return (
    <Card>
      <CardBody className="pt-6">
        <h2 className="text-xl font-bold text-text">Ranking dos setores</h2>
        <ol className="mt-5 space-y-5">
          {!ranking && [1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}
          {ranking?.length === 0 && <p className="text-muted">Ainda não há reservas registradas.</p>}
          {ranking?.slice(0, 3).map((r, i) => (
            <li key={r.id} className="grid grid-cols-[2.5rem_9rem_1fr_auto] items-center gap-4">
              <span className="text-muted">{i + 1}º</span>
              <span className="truncate text-lg font-semibold text-text">{r.name}</span>
              <Progress value={max ? (r.totalReservations / max) * 100 : 0} tone="info" />
              <span className="text-lg font-bold tabular-nums text-text">{r.totalReservations}</span>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={52} height={52} className="size-13 rounded-xl" priority />
            <span className="text-2xl font-bold text-text">Praça Central Estacionamento</span>
          </Link>
          <nav className="flex items-center gap-6" aria-label="Principal">
            <ApiStatus className="hidden md:flex" />
            <Link href="/admin" className="text-lg font-medium text-muted hover:text-text">Painel</Link>
            <Link href="/reserva" className="inline-flex h-12 items-center rounded-xl bg-brand px-7 text-lg font-semibold text-white hover:bg-brand-strong active:scale-[0.98]">
              Reservar vaga
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 px-6 py-10">
        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-text md:text-5xl">Estacionar na Praça Central Estacionamento ficou simples.</h1>
            <p className="mt-5 max-w-[46ch] text-xl text-muted">Escolha um setor, reserve em poucos passos e acompanhe tudo pela placa.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/reserva" className="inline-flex h-14 items-center rounded-xl bg-brand px-8 text-lg font-semibold text-white hover:bg-brand-strong active:scale-[0.98]">
                Reservar agora
              </Link>
              <Link href="/reserva?tab=consultar" className="inline-flex h-14 items-center rounded-xl border border-border bg-surface px-8 text-lg font-semibold text-text hover:bg-surface-2 active:scale-[0.98]">
                Consultar placa
              </Link>
            </div>
          </div>
          <LiveSpots />
        </section>

        <Card>
          <CardBody className="pt-6">
            <h2 className="text-xl font-bold text-text">Como funciona</h2>
            <ol className="mt-6 grid gap-8 md:grid-cols-3">
              {STEPS.map(([title, text], i) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl font-bold text-brand">{i + 1}</span>
                  <div>
                    <p className="text-lg font-semibold text-text">{title}</p>
                    <p className="mt-1 text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <RankingCard />
          <Card>
            <CardBody className="pt-6">
              <h2 className="text-xl font-bold text-text">Por que funciona</h2>
              <ul className="mt-5 space-y-5">
                {REASONS.map((r) => (
                  <li key={r} className="flex items-center gap-4 text-lg text-text">
                    <CheckCircle2 className="size-7 shrink-0 fill-brand text-white" strokeWidth={2} aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      </main>

      <footer className="pb-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-4 px-6">
          <Image src="/logo.png" alt="" width={52} height={52} className="size-13 rounded-xl" />
          <span className="leading-tight">
            <span className="block text-lg font-bold text-text">Praça Central Estacionamento</span>
            <span className="block text-muted">Mais organização para o seu dia.</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
