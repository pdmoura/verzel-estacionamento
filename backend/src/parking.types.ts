// ── Request bodies ────────────────────────────────────

export interface CreateSectorBody {
  name: string;
  location: string;
  reservableQuota: number;
  hourlyRate: number;
}

export interface CreateReservationBody {
  plate: string;
  sectorId: number;
  expectedArrival: string; // ISO 8601
}

export interface JoinWaitlistBody {
  plate: string;
  expectedArrival: string; // ISO 8601
}

// ── Response types ────────────────────────────────────

export interface SectorResponse {
  id: number;
  name: string;
  location: string;
  reservableQuota: number;
  hourlyRate: number;
  availableSpots: number;
  createdAt: string;
}

export interface ReservationResponse {
  id: number;
  plate: string;
  sectorId: number;
  expectedArrival: string;
  status: string;
  createdAt: string;
  sector: SectorResponse;
}

export interface WaitlistEntryResponse {
  id: number;
  plate: string;
  sectorId: number;
  expectedArrival: string;
  status: string;
  createdAt: string;
}

export interface RankingItemResponse {
  id: number;
  name: string;
  location: string;
  hourlyRate: number;
  totalReservations: number;
}

export interface HistoryEventResponse {
  id: number;
  type: string;
  description: string;
  createdAt: string;
  reservationId: number | null;
  waitlistEntryId: number | null;
  originEventId: number | null;
  originEvent: HistoryEventResponse | null;
  reservation: ReservationResponse | null;
  waitlistEntry: (WaitlistEntryResponse & { sector: SectorResponse }) | null;
}

// ── Error response ────────────────────────────────────

export interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
}
