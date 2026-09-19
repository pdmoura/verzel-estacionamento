'use client';

import useSWR from 'swr';
import * as api from './api';
import type { ReservationStatus } from './types';

/** Polling interval (ms) so every open screen reflects other users' actions. */
export const LIVE_REFRESH = 5000;

const live = { refreshInterval: LIVE_REFRESH, revalidateOnFocus: true, keepPreviousData: true } as const;

export const useSectors = () => useSWR('sectors', api.getSectors, live);

export const useRanking = () => useSWR('ranking', api.getRanking, live);

export const useReservations = (filters?: { plate?: string; status?: ReservationStatus | '' }) =>
  useSWR(['reservations', filters?.plate ?? '', filters?.status ?? ''], () => api.getReservations(filters), live);

export const useAllWaitlist = () => useSWR('waitlist', api.getAllWaitlist, live);

export const useWaitlist = (sectorId: number | null) =>
  useSWR(sectorId ? ['waitlist', sectorId] : null, () => api.getWaitlist(sectorId as number), live);

export const useHistory = () => useSWR('history', api.getGlobalHistory, live);

export const useReservationHistory = (reservationId: number | null) =>
  useSWR(reservationId ? ['history', reservationId] : null, () => api.getReservationHistory(reservationId as number));

export const useHealth = () => useSWR('health', api.getHealth, { refreshInterval: 30_000, shouldRetryOnError: false });
