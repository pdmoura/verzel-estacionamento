'use client';

import { CalendarDays, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { ReservationForm } from '@/components/forms/reservation-form';
import { ReservationHistoryModal } from '@/components/reservation-history-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/field';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveTable, type Column } from '@/components/ui/responsive-table';
import * as api from '@/lib/api';
import { RESERVATION_STATUS_LABEL, RESERVATION_TONE, formatArrival, normalizePlateInput } from '@/lib/format';
import { useReservations, useSectors } from '@/lib/hooks';
import type { Reservation, ReservationStatus } from '@/lib/types';

export default function ReservationsPage() {
  const { mutate } = useSWRConfig();
  const { data: sectors } = useSectors();
  const [plateInput, setPlateInput] = useState('');
  const [plate, setPlate] = useState('');
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  const { data: reservations, error } = useReservations({ plate, status });

  const [openForm, setOpenForm] = useState(false);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPlate(plateInput), 300);
    return () => clearTimeout(t);
  }, [plateInput]);

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await api.cancelReservation(cancelTarget.id);
      toast.success(result.promoted ? 'Reserva cancelada. A primeira placa da lista de espera foi promovida.' : 'Reserva cancelada. A vaga voltou para o setor.');
      await mutate(() => true);
      setCancelTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar reserva.');
    } finally {
      setCancelling(false);
    }
  }

  const columns: Column<Reservation>[] = [
    { key: 'plate', header: 'Placa', primary: true, cell: (r) => <span className="text-base font-bold tracking-wide text-text">{r.plate}</span> },
    { key: 'id', header: '#', cell: (r) => <span className="tabular-nums">#{String(r.id).padStart(3, '0')}</span> },
    { key: 'sector', header: 'Setor', cell: (r) => r.sector.name },
    { key: 'arrival', header: 'Chegada prevista', cell: (r) => formatArrival(r.expectedArrival) },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <Badge tone={RESERVATION_TONE[r.status]} dot>
          {RESERVATION_STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      cell: (r) => (
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" size="sm" className="border border-brand/30 bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand-strong" onClick={() => setHistoryId(r.id)} icon={<FileText className="size-4" strokeWidth={1.75} />}>
            Histórico
          </Button>
          {r.status === 'ACTIVE' && (
            <Button variant="ghost" size="sm" className="border border-rose-200 bg-[#fee2e2] text-[#dc2626] hover:bg-rose-100 hover:text-[#b91c1c]" onClick={() => setCancelTarget(r)} icon={<Trash2 className="size-4" strokeWidth={1.75} />}>
              Cancelar
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filtered = !!plate || !!status;

  return (
    <>
      <PageHeader
        title="Reservas"
        description="Uma placa só pode ter uma reserva ativa por vez. Cancelar uma reserva promove automaticamente a primeira placa da lista de espera do setor."
        actions={
          <Button size="lg" onClick={() => setOpenForm(true)} icon={<Plus className="size-5" strokeWidth={2} />}>
            Nova reserva
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="Todas as reservas"
          actions={
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden />
                <Input aria-label="Buscar por placa" value={plateInput} onChange={(e) => setPlateInput(normalizePlateInput(e.target.value))} placeholder="Buscar placa" className="h-12 pl-12 sm:w-60" />
              </div>
              <Select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value as ReservationStatus | '')} className="h-12 sm:w-64">
                <option value="">Todos os status</option>
                <option value="ACTIVE">Ativas</option>
                <option value="PROMOTED">Promovidas</option>
                <option value="CANCELLED">Canceladas</option>
              </Select>
            </div>
          }
        />
        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-xl border border-border">
            {error && <p className="p-5 text-sm text-rose-600">{error.message}</p>}
            {!reservations && !error && (
              <div className="space-y-3 p-5">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            )}
            {reservations?.length === 0 && (
              <EmptyState icon={<CalendarDays />} title={filtered ? 'Nenhuma reserva encontrada' : 'Nenhuma reserva ainda'} description={filtered ? 'Ajuste a busca ou o filtro de status.' : 'Crie a primeira reserva ou use o portal do motorista.'} />
            )}
            {reservations && reservations.length > 0 && <ResponsiveTable columns={columns} rows={reservations} rowKey={(r) => r.id} className="[&_thead_tr]:border-t-0" />}
          </div>
        </div>
      </Card>

      <Modal open={openForm} onClose={() => setOpenForm(false)} title="Nova reserva" description="A vaga é descontada do setor no momento da reserva.">
        <ReservationForm sectors={sectors ?? []} onCreated={() => setOpenForm(false)} onCancel={() => setOpenForm(false)} />
      </Modal>

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        loading={cancelling}
        title={`Cancelar reserva #${cancelTarget?.id ?? ''}?`}
        description={`A reserva da placa ${cancelTarget?.plate ?? ''} no ${cancelTarget?.sector.name ?? 'setor'} será cancelada. Se houver placas na lista de espera, a primeira será promovida automaticamente.`}
        confirmLabel="Cancelar reserva"
      />

      <ReservationHistoryModal reservationId={historyId} onClose={() => setHistoryId(null)} />
    </>
  );
}
