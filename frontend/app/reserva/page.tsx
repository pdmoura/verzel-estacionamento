'use client';

import { useState, useEffect } from 'react';
import * as api from '../api-client';

export default function ReservaPage() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [sectorId, setSectorId] = useState('');
  const [plate, setPlate] = useState('');
  const [arrival, setArrival] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showWaitlistOption, setShowWaitlistOption] = useState(false);

  useEffect(() => {
    const fetchSectors = () => {
      api.getSectors().then(setSectors).catch(console.error);
    };
    
    // Carrega imediatamente ao abrir a página
    fetchSectors();
    
    // Atualiza os dados a cada 5 segundos (Polling)
    const interval = setInterval(fetchSectors, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setShowWaitlistOption(false);
    setSubmitting(true);

    const isoArrival = arrival ? new Date(arrival).toISOString() : '';

    try {
      await api.createReservation({
        plate,
        sectorId: parseInt(sectorId, 10),
        expectedArrival: isoArrival,
      });
      setSuccess('Reserva confirmada com sucesso! Vaga garantida.');
      setPlate('');
      setArrival('');
      setSectorId('');
    } catch (err: any) {
      if (err.code === 'NO_SPOTS') {
        setError(
          'Este setor está lotado no momento. Deseja entrar na lista de espera?'
        );
        setShowWaitlistOption(true);
      } else {
        setError(err.message || 'Erro ao realizar reserva.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setError(null);
    setSubmitting(true);
    const isoArrival = arrival ? new Date(arrival).toISOString() : '';

    try {
      await api.joinWaitlist(parseInt(sectorId, 10), {
        plate,
        expectedArrival: isoArrival,
      });
      setSuccess('Você entrou na lista de espera! Avisaremos quando uma vaga vagar.');
      setShowWaitlistOption(false);
      setPlate('');
      setArrival('');
      setSectorId('');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar na lista de espera.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="driver-portal-wrapper">
      <div className="card driver-card">
        <div className="driver-header">
          <div className="driver-icon">
            <i className="bi bi-car-front-fill"></i>
          </div>
          <h2 className="fw-bold mb-2">Reserve sua Vaga</h2>
          <p className="text-muted">Estacionamento Rotativo — Praça Central</p>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Setor Desejado</label>
            <select
              className="form-select"
              value={sectorId}
              onChange={(e) => {
                setSectorId(e.target.value);
                setShowWaitlistOption(false);
              }}
              required
            >
              <option value="">Selecione um setor...</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.availableSpots} vagas disponíveis) - R$ {s.hourlyRate.toFixed(2)}/h
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label">Placa do Veículo</label>
            <input
              type="text"
              className="form-control"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="AAA-1234"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Previsão de Chegada</label>
            <input
              type="datetime-local"
              className="form-control"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              required
            />
          </div>

          {!showWaitlistOption ? (
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={submitting}
            >
              {submitting ? 'Processando...' : 'Confirmar Reserva'}
            </button>
          ) : (
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-warning btn-lg"
                onClick={handleJoinWaitlist}
                disabled={submitting}
              >
                Entrar na Lista de Espera
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowWaitlistOption(false)}
              >
                Cancelar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
