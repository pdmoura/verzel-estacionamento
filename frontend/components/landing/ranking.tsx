'use client';

import { Skeleton } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/format';
import { useRanking } from '@/lib/hooks';

/** Real ranking, plain rows. The number is the total of reservations ever made in the sector. */
export function RankingStrip() {
  const { data: ranking, error } = useRanking();
  if (error) return null;

  return (
    <section aria-labelledby="ranking-title" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="ranking-title" className="text-2xl font-semibold tracking-tight text-text md:text-3xl">
            Setores mais procurados
          </h2>
          <p className="mt-3 max-w-[36ch] text-muted">Contagem de todas as reservas já feitas, incluindo as canceladas e as promovidas da fila.</p>
        </div>
        <div className="lg:col-span-8">
          {!ranking && <Skeleton className="h-40" />}
          {ranking?.length === 0 && <p className="text-muted">Ainda não há reservas registradas.</p>}
          {ranking && ranking.length > 0 && (
            <ol className="border-t border-border">
              {ranking.map((r, i) => (
                <li key={r.id} className="reveal grid grid-cols-[2ch_1fr_auto] items-baseline gap-4 border-b border-border py-5">
                  <span className="font-mono text-sm text-muted">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-text">{r.name}</p>
                    <p className="text-sm text-muted">{formatMoney(r.hourlyRate)} por hora</p>
                  </div>
                  <p className="font-mono text-3xl font-medium tabular-nums text-text md:text-4xl">
                    {r.totalReservations}
                    <span className="ml-2 text-sm font-normal text-muted">reservas</span>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
