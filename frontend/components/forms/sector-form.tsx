'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import * as api from '@/lib/api';

export function SectorForm({ onDone }: { onDone?: () => void }) {
  const { mutate } = useSWRConfig();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [quota, setQuota] = useState('');
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const sector = await api.createSector({
        name: name.trim(),
        location: location.trim(),
        reservableQuota: parseInt(quota, 10),
        hourlyRate: parseFloat(rate),
      });
      toast.success(`Setor "${sector.name}" cadastrado com ${sector.reservableQuota} vagas.`);
      setName('');
      setLocation('');
      setQuota('');
      setRate('');
      await mutate('sectors');
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar setor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome" htmlFor="sector-name" className="sm:col-span-2">
        <Input id="sector-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Setor A" required maxLength={60} autoFocus />
      </Field>
      <Field label="Localização" htmlFor="sector-location" className="sm:col-span-2">
        <Input id="sector-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex.: Ala Norte, próximo à fonte" maxLength={120} />
      </Field>
      <Field label="Cota de vagas" htmlFor="sector-quota" hint="Número inteiro, mínimo 1.">
        <Input id="sector-quota" type="number" inputMode="numeric" min={1} step={1} value={quota} onChange={(e) => setQuota(e.target.value)} placeholder="20" required />
      </Field>
      <Field label="Tarifa por hora (R$)" htmlFor="sector-rate" hint="Use ponto para centavos, ex.: 5.50">
        <Input id="sector-rate" type="number" inputMode="decimal" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="5.50" required />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        {onDone && (
          <Button variant="outline" onClick={onDone} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          Cadastrar setor
        </Button>
      </div>
    </form>
  );
}
