'use client';

import { Building2, CarFront, Gauge, Hourglass, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ReservationHistoryModal } from '@/components/reservation-history-modal';
import { Timeline } from '@/components/timeline';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
import { formatMoney, occupancy } from '@/lib/format';
import { useAllWaitlist, useHistory, useRanking, useReservations, useSectors } from '@/lib/hooks';

export default function DashboardPage() {
  const { data: sectors } = useSectors();
  const { data: reservations } = useReservations();
  const { data: waitlist } = useAllWaitlist();
  const { data: ranking } = useRanking();
  const { data: history } = useHistory();
  const [openReservation, setOpenReservation] = useState<number | null>(null);

  const totalSpots = sectors?.reduce((acc, s) => acc + s.reservableQuota, 0) ?? 0;
  const available = sectors?.reduce((acc, s) => acc + s.availableSpots, 0) ?? 0;
  const used = totalSpots - available;
  const rate = totalSpots > 0 ? Math.round((used / totalSpots) * 100) : 0;
  const active = reservations?.filter((r) => r.status === 'ACTIVE').length;
  const recent = history ? [...history].reverse().slice(0, 6) : undefined;

  return (
    <>
      <PageHeader title="Visão geral" description="Situação do estacionamento em tempo real. Os dados são atualizados automaticamente a cada 5 segundos." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Setores" value={sectors ? sectors.length : <Skeleton className="h-8 w-12" />} hint={`${totalSpots} vagas no total`} icon={<Building2 />} />
        <StatCard label="Reservas ativas" value={active ?? <Skeleton className="h-8 w-12" />} hint={`${reservations?.length ?? 0} no histórico`} icon={<CarFront />} tone="success" />
        <StatCard label="Na lista de espera" value={waitlist ? waitlist.length : <Skeleton className="h-8 w-12" />} hint="Aguardando promoção" icon={<Hourglass />} tone="warning" />
        <StatCard label="Ocupação" value={sectors ? `${rate}%` : <Skeleton className="h-8 w-12" />} hint={`${used} de ${totalSpots} vagas ocupadas`} icon={<Gauge />} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Ocupação por setor" description="Vagas reservadas em relação à cota de cada setor." actions={<Link href="/admin/setores" className="text-sm font-semibold text-brand hover:underline">Gerenciar</Link>} />
          <CardBody className="space-y-4">
            {!sectors && [1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
            {sectors?.length === 0 && (
              <EmptyState icon={<Building2 />} title="Nenhum setor cadastrado" description="Cadastre o primeiro setor para começar a receber reservas." action={<Link href="/admin/setores" className="text-sm font-semibold text-brand hover:underline">Cadastrar setor</Link>} />
            )}
            {sectors?.map((s) => {
              const o = occupancy(s);
              return (
                <div key={s.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-semibold text-text">{s.name}</span>
                      {s.location && <span className="ml-2 hidden text-muted sm:inline">{s.location}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted tabular-nums">{o.used}/{s.reservableQuota}</span>
                      <Badge tone={o.tone}>{s.availableSpots === 0 ? 'Lotado' : `${o.rate}%`}</Badge>
                    </div>
                  </div>
                  <Progress value={o.rate} tone={o.tone} />
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Top setores" description="Por total de reservas." actions={<Link href="/admin/ranking" className="text-sm font-semibold text-brand hover:underline">Ranking</Link>} />
          <CardBody className="space-y-3">
            {!ranking && [1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
            {ranking?.length === 0 && <EmptyState icon={<Trophy />} title="Sem reservas ainda" description="O ranking aparece após a primeira reserva." />}
            {ranking?.slice(0, 5).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-surface-2 text-muted'}`}>{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{item.name}</p>
                  <p className="truncate text-xs text-muted">{formatMoney(item.hourlyRate)}/h</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-text">{item.totalReservations}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title="Atividade recente" description="Últimos eventos registrados." actions={<Link href="/admin/historico" className="text-sm font-semibold text-brand hover:underline">Ver tudo</Link>} />
          <CardBody>
            {!recent && <Skeleton className="h-24" />}
            {recent?.length === 0 && <EmptyState icon={<CarFront />} title="Nada por aqui ainda" description="Reservas e movimentações da lista de espera aparecerão aqui." />}
            {recent && recent.length > 0 && <Timeline events={recent} compact onOpenReservation={setOpenReservation} />}
          </CardBody>
        </Card>
      </div>

      <ReservationHistoryModal reservationId={openReservation} onClose={() => setOpenReservation(null)} />
    </>
  );
}
