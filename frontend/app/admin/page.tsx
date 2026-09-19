'use client';

import { ArrowRight, BarChart3, CalendarDays, CarFront, Clock3, PieChart, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/cn';
import { EVENT_SHORT, EVENT_TONE, eventSubject, formatRelative, occupancy } from '@/lib/format';
import { useAllWaitlist, useHistory, useRanking, useReservations, useSectors } from '@/lib/hooks';

const DOT: Record<string, string> = {
  success: 'bg-[#16a34a]',
  warning: 'bg-[#f59e0b]',
  danger: 'bg-[#e11d2e]',
  info: 'bg-brand',
  neutral: 'bg-slate-400',
};

function DateChip() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(now);
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(now);
  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface-2 px-4 py-2.5 text-[15px] text-text">
      <span className="flex items-center gap-2">
        <CalendarDays className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
        {date.charAt(0).toUpperCase() + date.slice(1).replace('.,', ',')}
      </span>
      <span className="flex items-center gap-2 font-semibold">
        <Clock3 className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
        {time}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: sectors } = useSectors();
  const { data: reservations } = useReservations();
  const { data: waitlist } = useAllWaitlist();
  const { data: ranking } = useRanking();
  const { data: history } = useHistory();

  const totalSpots = sectors?.reduce((acc, s) => acc + s.reservableQuota, 0) ?? 0;
  const available = sectors?.reduce((acc, s) => acc + s.availableSpots, 0) ?? 0;
  const used = totalSpots - available;
  const rate = totalSpots > 0 ? Math.round((used / totalSpots) * 100) : 0;
  const active = reservations?.filter((r) => r.status === 'ACTIVE').length;
  const recent = history ? [...history].reverse().slice(0, 4) : undefined;

  return (
    <>
      <PageHeader eyebrow="Painel administrativo" title="Visão geral" description="Situação do estacionamento em tempo real." actions={<DateChip />} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Setores" value={sectors ? sectors.length : <Skeleton className="h-9 w-12" />} hint={`${totalSpots} vagas no total`} icon={<CarFront strokeWidth={1.75} />} />
        <StatCard label="Reservas ativas" value={active ?? <Skeleton className="h-9 w-12" />} hint={`${reservations?.length ?? 0} no histórico`} icon={<CalendarDays strokeWidth={1.75} />} tone="success" />
        <StatCard label="Na lista de espera" value={waitlist ? waitlist.length : <Skeleton className="h-9 w-12" />} hint="Aguardando promoção" icon={<Clock3 strokeWidth={1.75} />} tone="warning" />
        <StatCard label="Ocupação" value={sectors ? `${rate}%` : <Skeleton className="h-9 w-12" />} hint={`${used} de ${totalSpots} vagas`} icon={<PieChart strokeWidth={1.75} />} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Ocupação por setor" icon={<BarChart3 strokeWidth={1.75} />} />
          <CardBody className="space-y-6">
            {!sectors && [1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
            {sectors?.length === 0 && <EmptyState icon={<CarFront />} title="Nenhum setor cadastrado" description="Cadastre o primeiro setor para começar a receber reservas." />}
            {sectors?.map((s) => {
              const o = occupancy(s);
              return (
                <div key={s.id}>
                  <div className="mb-2 flex items-center justify-between text-base">
                    <span className="font-semibold text-text">{s.name}</span>
                    <span className="text-muted tabular-nums">{o.used}/{s.reservableQuota}</span>
                  </div>
                  <Progress value={o.rate} tone={o.tone} />
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Top setores" icon={<Trophy strokeWidth={1.75} />} />
          <CardBody>
            {!ranking && <Skeleton className="h-40" />}
            {ranking?.length === 0 && <EmptyState icon={<Trophy />} title="Sem reservas ainda" description="O ranking aparece após a primeira reserva." />}
            <ol className="divide-y divide-border">
              {ranking?.slice(0, 4).map((item, idx) => (
                <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold', idx === 0 ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-surface-2 text-muted')}>{idx + 1}</span>
                  <span className="flex-1 text-base font-semibold text-text">{item.name}</span>
                  <span className="text-base font-bold tabular-nums text-text">{item.totalReservations}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Atividade recente"
          icon={<Clock3 strokeWidth={1.75} />}
          actions={
            <Link href="/admin/historico" className="inline-flex items-center gap-2 text-base font-medium text-brand hover:underline">
              Ver histórico completo <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
            </Link>
          }
        />
        <CardBody className="pb-2">
          {!recent && <Skeleton className="h-24" />}
          {recent?.length === 0 && <EmptyState icon={<CarFront />} title="Nada por aqui ainda" description="Reservas e movimentações da lista de espera aparecerão aqui." />}
          <ul className="divide-y divide-border">
            {recent?.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-4">
                <span className={cn('size-3.5 shrink-0 rounded-full', DOT[EVENT_TONE[e.type]])} aria-hidden />
                <span className="w-48 font-semibold text-text">{EVENT_SHORT[e.type]}</span>
                <span className="flex-1 text-muted">{eventSubject(e)}</span>
                <span className="shrink-0 text-muted">{formatRelative(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
