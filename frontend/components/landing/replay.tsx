'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { EVENT_LABEL, formatDateTime } from '@/lib/format';
import { useHistory, useSectors } from '@/lib/hooks';
import type { HistoryEvent, Sector } from '@/lib/types';

/**
 * Signature movement: scrolling replays the real event log of one sector.
 * The stage on the left is pinned and recomputes the sector state after each
 * event that crosses the middle of the viewport. Nothing here is invented:
 * the events come from GET /history and the arithmetic is the same the API uses.
 */

interface Step {
  event: HistoryEvent;
  available: number;
  queue: number;
  peak: boolean;
}

function sectorOf(e: HistoryEvent): number | null {
  return e.reservation?.sectorId ?? e.waitlistEntry?.sectorId ?? null;
}

function buildSteps(events: HistoryEvent[], sector: Sector): Step[] {
  let active = 0;
  let queue = 0;
  return events.map((event) => {
    switch (event.type) {
      case 'RESERVATION_CREATED':
        active += 1;
        break;
      case 'RESERVATION_CANCELLED':
        active -= 1;
        break;
      case 'WAITLIST_JOINED':
        queue += 1;
        break;
      case 'WAITLIST_LEFT':
      case 'WAITLIST_PROMOTED':
        queue -= 1;
        break;
    }
    return {
      event,
      available: Math.max(0, sector.reservableQuota - active),
      queue: Math.max(0, queue),
      peak: event.type === 'WAITLIST_PROMOTED',
    };
  });
}

function useActiveStep(count: number) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (count === 0 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.step);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      // a step becomes active when it crosses the middle band of the viewport
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  return { refs, active };
}

export function Replay() {
  const { data: history } = useHistory();
  const { data: sectors } = useSectors();

  const { sector, steps } = useMemo(() => {
    if (!history || !sectors || sectors.length === 0) return { sector: null, steps: [] as Step[] };
    // the sector with the richest story wins; a promotion is worth more than a plain reservation
    const score = new Map<number, number>();
    for (const e of history) {
      const id = sectorOf(e);
      if (id === null) continue;
      score.set(id, (score.get(id) ?? 0) + (e.type === 'WAITLIST_PROMOTED' ? 5 : 1));
    }
    let bestId: number | null = null;
    let best = 0;
    for (const [id, s] of score) if (s > best) (best = s), (bestId = id);
    const chosen = sectors.find((s) => s.id === bestId) ?? null;
    if (!chosen) return { sector: null, steps: [] as Step[] };
    const events = history.filter((e) => sectorOf(e) === chosen.id).slice(-8);
    return { sector: chosen, steps: buildSteps(events, chosen) };
  }, [history, sectors]);

  const { refs, active } = useActiveStep(steps.length);

  if (!sector || steps.length === 0) return null;

  const current = steps[active] ?? steps[0];

  return (
    <section aria-labelledby="replay-title" className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* pinned stage */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 lg:py-24">
              <h2 id="replay-title" className="pt-16 text-2xl font-semibold tracking-tight text-text md:text-3xl lg:pt-0">
                O {sector.name} hoje, evento por evento
              </h2>
              <p className="mt-3 max-w-[40ch] text-muted">Role para avançar. O quadro mostra o estado do setor depois de cada registro.</p>

              <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8">
                <div>
                  <dt className="text-sm text-muted">Vagas livres</dt>
                  <dd className="mt-1 font-mono text-5xl font-medium tabular-nums text-text md:text-7xl">
                    {current.available}
                    <span className="text-2xl text-muted md:text-3xl">/{sector.reservableQuota}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Na fila</dt>
                  <dd className="mt-1 font-mono text-5xl font-medium tabular-nums text-text md:text-7xl">{current.queue}</dd>
                </div>
              </dl>

              <p
                aria-live="polite"
                className={cn(
                  'mt-8 min-h-14 text-lg leading-snug transition-colors duration-300',
                  current.peak ? 'font-semibold text-brand' : 'text-text',
                )}
              >
                {EVENT_LABEL[current.event.type]}
              </p>
            </div>
          </div>

          {/* scrolling log */}
          <ol className="py-16 lg:col-span-7 lg:py-24">
            {steps.map((step, i) => (
              <li
                key={step.event.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-step={i}
                className={cn(
                  'reveal border-l-2 pl-6 transition-colors duration-300',
                  step.peak ? 'min-h-[70vh] py-16 lg:min-h-[85vh]' : 'min-h-[38vh] py-10 lg:min-h-[45vh]',
                  i === active ? 'border-brand' : 'border-border',
                )}
              >
                <time dateTime={step.event.createdAt} className="font-mono text-sm text-muted">
                  {formatDateTime(step.event.createdAt)}
                </time>
                <p
                  className={cn(
                    'mt-3 max-w-[34ch] leading-snug text-text',
                    step.peak ? 'text-3xl font-semibold md:text-5xl' : 'text-xl md:text-2xl',
                    i === active ? 'opacity-100' : 'opacity-50',
                  )}
                >
                  {step.event.description}
                </p>
                {step.peak && step.event.originEvent && (
                  <p className="mt-4 max-w-[40ch] text-muted">Originado por: {step.event.originEvent.description}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
