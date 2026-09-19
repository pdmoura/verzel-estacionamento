'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ReservationForm } from '@/components/forms/reservation-form';
import { formatDateTime } from '@/lib/format';
import { useSectors } from '@/lib/hooks';
import type { Reservation } from '@/lib/types';

/**
 * The closing is a real input: the same reservation form the driver portal uses.
 * After a reservation it stays on screen with the result instead of fading away.
 */
export function Closing() {
  const { data: sectors } = useSectors();
  const [done, setDone] = useState<Reservation | null>(null);

  return (
    <section id="reservar" aria-labelledby="closing-title" className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-5">
          <h2 id="closing-title" className="text-3xl font-semibold tracking-tight text-text md:text-4xl">
            Reservar vaga
          </h2>
          <p className="mt-3 max-w-[40ch] text-muted">Placa, setor e horário previsto. A vaga sai do quadro na hora.</p>
          <p className="mt-8 text-sm text-muted">
            Quer consultar ou cancelar uma reserva? Use o{' '}
            <Link href="/reserva" className="font-semibold text-text underline underline-offset-4">
              portal do motorista
            </Link>
            . Administra o pátio? Abra o{' '}
            <Link href="/admin" className="font-semibold text-text underline underline-offset-4">
              painel de gestão
            </Link>
            .
          </p>
        </div>

        <div className="lg:col-span-7">
          {done ? (
            <div className="rounded-2xl border border-border bg-bg p-6 sm:p-8">
              <p className="text-sm text-muted">Reserva confirmada</p>
              <p className="mt-2 font-mono text-4xl font-medium tracking-wider text-text">{done.plate}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted">Setor</dt>
                  <dd className="font-semibold text-text">{done.sector.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">Número</dt>
                  <dd className="font-semibold text-text">#{done.id}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted">Chegada prevista</dt>
                  <dd className="font-semibold text-text">{formatDateTime(done.expectedArrival)}</dd>
                </div>
              </dl>
              <button type="button" onClick={() => setDone(null)} className="mt-6 text-sm font-semibold text-brand hover:underline">
                Fazer outra reserva
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-bg p-6 sm:p-8">
              <ReservationForm sectors={sectors ?? []} onCreated={setDone} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
