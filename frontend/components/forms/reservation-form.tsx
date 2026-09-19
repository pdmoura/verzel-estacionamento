'use client';

import { Hourglass } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/api';
import { formatMoney, localToIso, normalizePlateInput, nowLocalInputValue } from '@/lib/format';
import type { Reservation, Sector } from '@/lib/types';

export function ReservationForm({
  sectors,
  initialSectorId,
  onCreated,
  onCancel,
}: {
  sectors: Sector[];
  initialSectorId?: number;
  onCreated?: (reservation: Reservation) => void;
  onCancel?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const [plate, setPlate] = useState('');
  const [sectorId, setSectorId] = useState(initialSectorId ? String(initialSectorId) : '');
  const [arrival, setArrival] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [offerWaitlist, setOfferWaitlist] = useState(false);

  const selected = sectors.find((s) => String(s.id) === sectorId);

  async function refresh() {
    await Promise.all([mutate('sectors'), mutate((key) => Array.isArray(key) && key[0] === 'reservations'), mutate('ranking'), mutate('history'), mutate('waitlist')]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setOfferWaitlist(false);
    try {
      const reservation = await api.createReservation({
        plate,
        sectorId: parseInt(sectorId, 10),
        expectedArrival: localToIso(arrival),
      });
      toast.success(`Reserva #${reservation.id} criada para ${reservation.plate} no ${reservation.sector.name}.`);
      await refresh();
      onCreated?.(reservation);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NO_SPOTS') {
        setOfferWaitlist(true);
        toast.warning('Setor lotado. Você pode entrar na lista de espera.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Erro ao criar reserva.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinWaitlist() {
    setSubmitting(true);
    try {
      const entry = await api.joinWaitlist(parseInt(sectorId, 10), { plate, expectedArrival: localToIso(arrival) });
      toast.success(`${entry.plate} entrou na lista de espera do ${selected?.name ?? 'setor'}.`);
      await refresh();
      await mutate((key) => Array.isArray(key) && key[0] === 'waitlist');
      onCancel?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar na lista de espera.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <Field label="Setor" htmlFor="res-sector">
        <Select id="res-sector" value={sectorId} onChange={(e) => { setSectorId(e.target.value); setOfferWaitlist(false); }} required>
          <option value="">Selecione um setor</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.availableSpots} de {s.reservableQuota} vagas · {formatMoney(s.hourlyRate)}/h
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Placa" htmlFor="res-plate" hint="Formato antigo (ABC1234) ou Mercosul (ABC1D23).">
          <Input
            id="res-plate"
            value={plate}
            onChange={(e) => setPlate(normalizePlateInput(e.target.value))}
            placeholder="ABC1D23"
            required
            minLength={7}
            maxLength={7}
            autoCapitalize="characters"
            className="font-mono uppercase tracking-[0.2em]"
          />
        </Field>
        <Field label="Chegada prevista" htmlFor="res-arrival">
          <Input id="res-arrival" type="datetime-local" value={arrival} min={nowLocalInputValue()} onChange={(e) => setArrival(e.target.value)} required />
        </Field>
      </div>

      {offerWaitlist ? (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold">O {selected?.name ?? 'setor'} está lotado.</p>
          <p className="mt-1">Entre na lista de espera: assim que uma reserva for cancelada, a primeira placa da fila é promovida automaticamente.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={handleJoinWaitlist} loading={submitting} icon={<Hourglass className="size-4" />}>
              Entrar na lista de espera
            </Button>
            <Button type="button" variant="outline" onClick={() => setOfferWaitlist(false)} disabled={submitting}>
              Escolher outro setor
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" loading={submitting}>
            Reservar vaga
          </Button>
        </div>
      )}
    </form>
  );
}
