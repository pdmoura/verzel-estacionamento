'use client';

import { Skeleton } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/format';
import { useSectors } from '@/lib/hooks';

/**
 * The board. Real sectors, real availability, refreshed every 5 s by SWR.
 * Numbers are tabular mono so a change reads as a change, like a departures board.
 */
export function Board() {
  const { data: sectors, error } = useSectors();

  return (
    <section aria-labelledby="board-title" className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-16">
      <h1 id="board-title" className="max-w-[18ch] text-3xl font-semibold leading-[1.1] tracking-tight text-text md:text-4xl">
        Vagas livres agora na praça
      </h1>

      {error && <p className="mt-8 text-muted">A API não respondeu. Tente de novo em instantes.</p>}

      {!sectors && !error && (
        <div className="mt-10 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {sectors && (
        <ol className="mt-10 border-t border-border">
          {sectors.map((s, i) => {
            const full = s.availableSpots === 0;
            return (
              <li
                key={s.id}
                className="reveal grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-border py-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:py-7"
                style={{ '--i': i } as React.CSSProperties}
              >
                <div className="min-w-0">
                  <p className="text-xl font-semibold text-text md:text-2xl">{s.name}</p>
                  {s.location && <p className="mt-0.5 truncate text-sm text-muted md:text-base">{s.location}</p>}
                </div>
                <p className="col-start-1 text-sm text-muted md:col-start-2 md:text-base">
                  {formatMoney(s.hourlyRate)} por hora, {s.reservableQuota} vagas
                </p>
                <p className="col-start-2 row-start-1 justify-self-end text-right font-mono tabular-nums md:col-start-3 md:row-auto">
                  {full ? (
                    <span className="text-2xl font-medium text-rose-600 md:text-4xl">lotado</span>
                  ) : (
                    <>
                      <span className="text-4xl font-medium text-text md:text-6xl">{s.availableSpots}</span>
                      <span className="ml-2 text-sm text-muted md:text-base">livres</span>
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
