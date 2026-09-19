'use client';

import { History } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { Timeline } from '@/components/timeline';
import { useReservationHistory } from '@/lib/hooks';

export function ReservationHistoryModal({
  reservationId,
  onClose,
}: {
  reservationId: number | null;
  onClose: () => void;
}) {
  const { data, error, isLoading } = useReservationHistory(reservationId);

  return (
    <Modal
      open={reservationId !== null}
      onClose={onClose}
      title={`Histórico da reserva #${reservationId ?? ''}`}
      description="Todos os eventos ligados a esta reserva, incluindo a trilha na lista de espera e o cancelamento que originou uma promoção."
      size="lg"
    >
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      )}
      {error && <p className="text-sm text-rose-600">{error.message}</p>}
      {data && data.length === 0 && (
        <EmptyState icon={<History />} title="Nenhum evento" description="Esta reserva ainda não tem eventos registrados." />
      )}
      {data && data.length > 0 && <Timeline events={data} compact />}
    </Modal>
  );
}
