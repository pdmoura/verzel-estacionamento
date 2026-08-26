const API_URL =
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({
      message: 'Erro desconhecido no servidor.',
    }));
    const err = new Error(body.message || `Erro ${res.status}`);
    (err as any).code = body.code;
    (err as any).statusCode = body.statusCode || res.status;
    throw err;
  }

  return res.json();
}

// ── Sectors ─────────────────────────────────────────────

export function getSectors() {
  return request<any[]>('/sectors');
}

export function createSector(data: {
  name: string;
  location: string;
  reservableQuota: number;
  hourlyRate: number;
}) {
  return request<any>('/sectors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Reservations ────────────────────────────────────────

export function getReservations() {
  return request<any[]>('/reservations');
}

export function createReservation(data: {
  plate: string;
  sectorId: number;
  expectedArrival: string;
}) {
  return request<any>('/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function cancelReservation(id: number) {
  return request<any>(`/reservations/${id}/cancel`, { method: 'POST' });
}

// ── Ranking ─────────────────────────────────────────────

export function getRanking() {
  return request<any[]>('/sectors/ranking');
}

// ── Waitlist ────────────────────────────────────────────

export function getWaitlist(sectorId: number) {
  return request<any[]>(`/sectors/${sectorId}/waitlist`);
}

export function joinWaitlist(
  sectorId: number,
  data: { plate: string; expectedArrival: string },
) {
  return request<any>(`/sectors/${sectorId}/waitlist`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function leaveWaitlist(id: number) {
  return request<any>(`/waitlist/${id}`, { method: 'DELETE' });
}

// ── History ─────────────────────────────────────────────

export function getGlobalHistory() {
  return request<any[]>('/history');
}

export function getReservationHistory(reservationId: number) {
  return request<any[]>(`/reservations/${reservationId}/history`);
}
