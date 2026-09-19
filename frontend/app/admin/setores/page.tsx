'use client';

import { Building2, Plus } from 'lucide-react';
import { useState } from 'react';
import { SectorForm } from '@/components/forms/sector-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { ResponsiveTable, type Column } from '@/components/ui/responsive-table';
import { formatDateTime, formatMoney, occupancy } from '@/lib/format';
import { useSectors } from '@/lib/hooks';
import type { Sector } from '@/lib/types';

const columns: Column<Sector>[] = [
  {
    key: 'name',
    header: 'Setor',
    primary: true,
    cell: (s) => (
      <div>
        <div className="font-semibold text-text">{s.name}</div>
        {s.location && <div className="text-xs text-muted">{s.location}</div>}
      </div>
    ),
  },
  {
    key: 'spots',
    header: 'Vagas',
    cell: (s) => {
      const o = occupancy(s);
      return (
        <div className="flex items-center gap-3 md:min-w-44">
          <Progress value={o.rate} tone={o.tone} className="hidden w-24 md:block" />
          <span className="tabular-nums">
            <span className="font-semibold text-text">{s.availableSpots}</span>
            <span className="text-muted"> / {s.reservableQuota} livres</span>
          </span>
        </div>
      );
    },
  },
  { key: 'rate', header: 'Tarifa', cell: (s) => <span className="tabular-nums">{formatMoney(s.hourlyRate)}/h</span> },
  {
    key: 'status',
    header: 'Status',
    cell: (s) => (s.availableSpots > 0 ? <Badge tone="success" dot>Disponível</Badge> : <Badge tone="danger" dot>Lotado</Badge>),
  },
  { key: 'created', header: 'Criado em', cell: (s) => <span className="text-muted">{formatDateTime(s.createdAt)}</span> },
];

export default function SectorsPage() {
  const { data: sectors, error } = useSectors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Setores"
        description="Cada setor tem uma cota de vagas reserváveis e uma tarifa por hora."
        actions={
          <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
            Novo setor
          </Button>
        }
      />

      <Card>
        <CardHeader title="Setores cadastrados" description={sectors ? `${sectors.length} setor(es)` : undefined} />
        {error && <p className="p-5 text-sm text-rose-600">{error.message}</p>}
        {!sectors && !error && (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        )}
        {sectors?.length === 0 && (
          <EmptyState
            icon={<Building2 />}
            title="Nenhum setor cadastrado"
            description="Cadastre o primeiro setor para liberar reservas no portal do motorista."
            action={<Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>Cadastrar setor</Button>}
          />
        )}
        {sectors && sectors.length > 0 && <ResponsiveTable columns={columns} rows={sectors} rowKey={(s) => s.id} />}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo setor" description="A cota define quantas reservas simultâneas o setor aceita.">
        <SectorForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
