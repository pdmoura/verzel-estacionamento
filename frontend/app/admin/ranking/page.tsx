'use client';

import { Trophy } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { ResponsiveTable, type Column } from '@/components/ui/responsive-table';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useRanking, useSectors } from '@/lib/hooks';
import type { RankingItem } from '@/lib/types';

const PODIUM = [
  { label: 'text-[#d97706]', circle: 'bg-[#fef3c7] text-[#f59e0b]' },
  { label: 'text-slate-500', circle: 'bg-slate-100 text-slate-400' },
  { label: 'text-[#c2410c]', circle: 'bg-[#ffedd5] text-[#c2410c]' },
];

export default function RankingPage() {
  const { data: ranking, error } = useRanking();
  const { data: sectors } = useSectors();
  const max = ranking?.[0]?.totalReservations ?? 0;
  const locationOf = (id: number) => sectors?.find((s) => s.id === id)?.location ?? '';

  const columns: Column<RankingItem & { position: number }>[] = [
    { key: 'pos', header: '#', cell: (r) => <span className="text-lg font-semibold text-text">{r.position}º</span> },
    {
      key: 'name',
      header: 'Setor',
      primary: true,
      cell: (r) => (
        <div>
          <div className="text-lg font-semibold text-text">{r.name}</div>
          {locationOf(r.id) && <div className="text-muted">{locationOf(r.id)}</div>}
        </div>
      ),
    },
    { key: 'rate', header: 'Tarifa', cell: (r) => <span className="tabular-nums">{formatMoney(r.hourlyRate)}/h</span> },
    {
      key: 'total',
      header: 'Reservas',
      cell: (r) => (
        <div className="flex items-center gap-6 md:w-96">
          <Progress value={max ? (r.totalReservations / max) * 100 : 0} tone="info" className="hidden flex-1 md:block" />
          <span className="text-lg font-bold tabular-nums text-text">{r.totalReservations}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Ranking de setores" description="Classificação pelo total de reservas registradas." />

      {ranking && ranking.length > 0 && (
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          {ranking.slice(0, 3).map((item, idx) => (
            <Card key={item.id} className="flex items-start justify-between p-6">
              <div>
                <p className={cn('text-sm font-semibold', PODIUM[idx].label)}>{idx + 1}º lugar</p>
                <p className="mt-2 text-2xl font-bold text-text">{item.name}</p>
                <p className="mt-2 text-muted">{item.totalReservations} reservas</p>
                <p className="text-muted">{formatMoney(item.hourlyRate)}/h</p>
              </div>
              <span className={cn('flex size-16 shrink-0 items-center justify-center rounded-full', PODIUM[idx].circle)}>
                <Trophy className="size-7" strokeWidth={1.75} aria-hidden />
              </span>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader title="Classificação completa" />
        {error && <p className="px-6 pb-6 text-sm text-rose-600">{error.message}</p>}
        {!ranking && !error && <div className="space-y-3 px-6 pb-6"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
        {ranking?.length === 0 && <EmptyState icon={<Trophy />} title="Ranking vazio" description="O ranking é calculado a partir da primeira reserva registrada." />}
        {ranking && ranking.length > 0 && <ResponsiveTable columns={columns} rows={ranking.map((r, i) => ({ ...r, position: i + 1 }))} rowKey={(r) => r.id} />}
      </Card>
    </>
  );
}
