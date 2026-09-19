export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'PROMOTED';
export type WaitlistStatus = 'WAITING' | 'PROMOTED' | 'LEFT';
export type HistoryEventType =
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CANCELLED'
  | 'WAITLIST_JOINED'
  | 'WAITLIST_LEFT'
  | 'WAITLIST_PROMOTED';

export interface Sector {
  id: number;
  name: string;
  location: string;
  reservableQuota: number;
  hourlyRate: number;
  availableSpots: number;
  createdAt: string;
}

export interface Reservation {
  id: number;
  plate: string;
  sectorId: number;
  expectedArrival: string;
  status: ReservationStatus;
  createdAt: string;
  sector: Sector;
}

export interface WaitlistEntry {
  id: number;
  plate: string;
  sectorId: number;
  expectedArrival: string;
  status: WaitlistStatus;
  reservationId: number | null;
  createdAt: string;
  sector?: Sector;
}

export interface RankingItem {
  id: number;
  name: string;
  location: string;
  hourlyRate: number;
  totalReservations: number;
}

export interface HistoryEvent {
  id: number;
  type: HistoryEventType;
  description: string;
  createdAt: string;
  reservationId: number | null;
  waitlistEntryId: number | null;
  originEventId: number | null;
  originEvent: { id: number; type: HistoryEventType; description: string; createdAt: string } | null;
  reservation: Reservation | null;
  waitlistEntry: WaitlistEntry | null;
}

export interface HealthStatus {
  status: string;
  database: string;
  latencyMs: number;
  timestamp: string;
}
