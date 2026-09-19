'use client';

import { Trophy } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { ResponsiveTable, type Column } from '@/components/ui/responsive-table';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useRanking } from '@/lib/hooks';
import type { RankingItem } from '@/lib/types';

const PODIUM = [
  'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
  'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/10 dark:text-slate-200',
  'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200',
];

export default function RankingPage() {
  const { data: ranking, error } = useRanking();
  const max = ranking?.[0]?.totalReservations ?? 0;

  const columns: Column<RankingItem & { position: number }>[] = [
    { key: 'pos', header: '#', cell: (r) => <span className="font-bold text-muted">{r.position}º</span> },
    {
      key: 'name',
      header: 'Setor',
      primary: true,
      cell: (r) => (
        <div>
          <div className="font-semibold text-text">{r.name}</div>
          {r.location && <div className="text-xs text-muted">{r.location}</div>}
        </div>
      ),
    },
    { key: 'rate', header: 'Tarifa', cell: (r) => <span className="tabular-nums">{formatMoney(r.hourlyRate)}/h</span> },
    {
      key: 'total',
      header: 'Reservas',
      cell: (r) => (
        <div className="flex items-center gap-3 md:min-w-48">
          <Progress value={max ? (r.totalReservations / max) * 100 : 0} tone="info" className="hidden w-28 md:block" />
          <span className="font-semibold tabular-nums text-text">{r.totalReservations}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Ranking de setores" description="Setores ordenados pelo total de reservas já registradas (ativas, promovidas e canceladas). Empates são resolvidos por nome." />

      {ranking && ranking.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {ranking.slice(0, 3).map((item, idx) => (
            <div key={item.id} className={cn('rounded-2xl border p-5', PODIUM[idx])}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide opacity-80">{idx + 1}º lugar</span>
                <Trophy className="size-5 opacity-80" aria-hidden />
              </div>
              <p className="mt-3 text-xl font-bold">{item.name}</p>
              <p className="text-sm opacity-80">{item.totalReservations} reserva(s) · {formatMoney(item.hourlyRate)}/h</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader title="Classificação completa" />
        {error && <p className="p-5 text-sm text-rose-600">{error.message}</p>}
        {!ranking && !error && <div className="space-y-3 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
        {ranking?.length === 0 && <EmptyState icon={<Trophy />} title="Ranking vazio" description="O ranking é calculado a partir da primeira reserva registrada." />}
        {ranking && ranking.length > 0 && (
          <ResponsiveTable columns={columns} rows={ranking.map((r, i) => ({ ...r, position: i + 1 }))} rowKey={(r) => r.id} />
        )}
      </Card>
    </>
  );
}
