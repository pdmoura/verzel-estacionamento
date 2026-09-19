import type { HistoryEventType, ReservationStatus, WaitlistStatus } from './types';

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatMoney = (value: number) => currency.format(value);

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 1) return 'agora';
  if (Math.abs(minutes) < 60) return minutes > 0 ? `há ${minutes} min` : `em ${-minutes} min`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return hours > 0 ? `há ${hours} h` : `em ${-hours} h`;
  const days = Math.round(hours / 24);
  return days > 0 ? `há ${days} d` : `em ${-days} d`;
}

/** Formats the plate as the user types: letters/digits only, upper case, max 7 chars. */
export function normalizePlateInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

/** Converts a `datetime-local` input value to ISO 8601 (UTC). */
export function localToIso(value: string): string {
  return value ? new Date(value).toISOString() : '';
}

/** Minimum value for a `datetime-local` input: now, in local time. */
export function nowLocalInputValue(offsetMinutes = 5): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function isoToLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  ACTIVE: 'Ativa',
  CANCELLED: 'Cancelada',
  PROMOTED: 'Promovida',
};

export const WAITLIST_STATUS_LABEL: Record<WaitlistStatus, string> = {
  WAITING: 'Aguardando',
  PROMOTED: 'Promovida',
  LEFT: 'Saiu',
};

export const EVENT_LABEL: Record<HistoryEventType, string> = {
  RESERVATION_CREATED: 'Reserva criada',
  RESERVATION_CANCELLED: 'Reserva cancelada',
  WAITLIST_JOINED: 'Entrou na lista de espera',
  WAITLIST_LEFT: 'Saiu da lista de espera',
  WAITLIST_PROMOTED: 'Promovido da lista de espera',
};

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const EVENT_TONE: Record<HistoryEventType, Tone> = {
  RESERVATION_CREATED: 'success',
  RESERVATION_CANCELLED: 'danger',
  WAITLIST_JOINED: 'warning',
  WAITLIST_LEFT: 'neutral',
  WAITLIST_PROMOTED: 'info',
};

export const RESERVATION_TONE: Record<ReservationStatus, Tone> = {
  ACTIVE: 'success',
  CANCELLED: 'danger',
  PROMOTED: 'info',
};

export function occupancy(sector: { reservableQuota: number; availableSpots: number }) {
  const used = sector.reservableQuota - sector.availableSpots;
  const rate = sector.reservableQuota > 0 ? Math.round((used / sector.reservableQuota) * 100) : 0;
  return { used, rate, tone: (sector.availableSpots === 0 ? 'danger' : 'info') as Tone };
}

const timeOnly = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

/** "Hoje 10:30", "Amanhã 09:00" or "24/04 10:30". */
export function formatArrival(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, now)) return `Hoje ${timeOnly.format(d)}`;
  if (sameDay(d, tomorrow)) return `Amanhã ${timeOnly.format(d)}`;
  return `${dayMonth.format(d)} ${timeOnly.format(d)}`;
}

export const formatTime = (iso: string) => timeOnly.format(new Date(iso));

/** Short label for an event: "ABC1D23 · Setor Norte". */
export function eventSubject(e: { reservation: { plate: string; sector: { name: string } } | null; waitlistEntry: { plate: string; sector?: { name: string } } | null }): string {
  const plate = e.reservation?.plate ?? e.waitlistEntry?.plate ?? '';
  const sector = e.reservation?.sector?.name ?? e.waitlistEntry?.sector?.name ?? '';
  return [plate, sector].filter(Boolean).join(' · ');
}

/** One-line sentence for the timeline: "ABC1D23 reservou Setor Norte". */
export function eventSentence(e: {
  type: HistoryEventType;
  reservationId: number | null;
  reservation: { plate: string; sector: { name: string } } | null;
  waitlistEntry: { plate: string; sector?: { name: string } } | null;
}): string {
  const plate = e.reservation?.plate ?? e.waitlistEntry?.plate ?? 'Placa';
  const sector = e.reservation?.sector?.name ?? e.waitlistEntry?.sector?.name ?? 'setor';
  switch (e.type) {
    case 'RESERVATION_CREATED':
      return `${plate} reservou ${sector}`;
    case 'RESERVATION_CANCELLED':
      return `${plate} cancelou a reserva${e.reservationId ? ` #${e.reservationId}` : ''}`;
    case 'WAITLIST_JOINED':
      return `${plate} entrou na fila do ${sector}`;
    case 'WAITLIST_LEFT':
      return `${plate} saiu da fila do ${sector}`;
    case 'WAITLIST_PROMOTED':
      return `${plate} foi promovida para a vaga liberada`;
  }
}

export const EVENT_SHORT: Record<HistoryEventType, string> = {
  RESERVATION_CREATED: 'Reserva criada',
  RESERVATION_CANCELLED: 'Reserva cancelada',
  WAITLIST_JOINED: 'Entrada na fila',
  WAITLIST_LEFT: 'Saída da fila',
  WAITLIST_PROMOTED: 'Placa promovida',
};
