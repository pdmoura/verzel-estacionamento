import type {
  HealthStatus,
  HistoryEvent,
  RankingItem,
  Reservation,
  ReservationStatus,
  Sector,
  WaitlistEntry,
} from './types';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Não foi possível conectar à API. Tente novamente em instantes.', 'NETWORK_ERROR', 0);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body.message === 'string'
        ? body.message
        : Array.isArray(body.message)
          ? body.message.join('; ')
          : `Erro ${res.status}`;
    throw new ApiError(message, body.code ?? 'UNKNOWN', body.statusCode ?? res.status);
  }

  return res.json() as Promise<T>;
}

// ── System ──────────────────────────────────────────────
export const getHealth = () => request<HealthStatus>('/health');

// ── Sectors ─────────────────────────────────────────────
export const getSectors = () => request<Sector[]>('/sectors');

export const createSector = (data: {
  name: string;
  location: string;
  reservableQuota: number;
  hourlyRate: number;
}) => request<Sector>('/sectors', { method: 'POST', body: JSON.stringify(data) });

export const getRanking = () => request<RankingItem[]>('/sectors/ranking');

// ── Reservations ────────────────────────────────────────
export function getReservations(filters?: { plate?: string; status?: ReservationStatus | '' }) {
  const params = new URLSearchParams();
  if (filters?.plate) params.set('plate', filters.plate);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return request<Reservation[]>(`/reservations${qs ? `?${qs}` : ''}`);
}

export const createReservation = (data: { plate: string; sectorId: number; expectedArrival: string }) =>
  request<Reservation>('/reservations', { method: 'POST', body: JSON.stringify(data) });

export const cancelReservation = (id: number) =>
  request<{ message: string; promoted: boolean }>(`/reservations/${id}/cancel`, { method: 'POST' });

// ── Waitlist ────────────────────────────────────────────
export const getAllWaitlist = () => request<WaitlistEntry[]>('/waitlist');

export const getWaitlist = (sectorId: number) => request<WaitlistEntry[]>(`/sectors/${sectorId}/waitlist`);

export const joinWaitlist = (sectorId: number, data: { plate: string; expectedArrival: string }) =>
  request<WaitlistEntry>(`/sectors/${sectorId}/waitlist`, { method: 'POST', body: JSON.stringify(data) });

export const leaveWaitlist = (id: number) =>
  request<{ message: string }>(`/waitlist/${id}`, { method: 'DELETE' });

// ── History ─────────────────────────────────────────────
export const getGlobalHistory = () => request<HistoryEvent[]>('/history');

export const getReservationHistory = (reservationId: number) =>
  request<HistoryEvent[]>(`/reservations/${reservationId}/history`);
