'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from './api-client';

/* ════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════ */

interface Sector {
  id: number;
  name: string;
  location: string;
  reservableQuota: number;
  hourlyRate: number;
  availableSpots: number;
}

interface Reservation {
  id: number;
  plate: string;
  sectorId: number;
  expectedArrival: string;
  status: string;
  createdAt: string;
  sector: Sector;
}

interface WaitlistEntry {
  id: number;
  plate: string;
  sectorId: number;
  expectedArrival: string;
  status: string;
  createdAt: string;
}

interface RankingItem {
  id: number;
  name: string;
  location: string;
  hourlyRate: number;
  totalReservations: number;
}

interface HistoryEvent {
  id: number;
  type: string;
  description: string;
  createdAt: string;
  reservationId: number | null;
  waitlistEntryId: number | null;
  originEventId: number | null;
  originEvent: { id: number; type: string; description: string } | null;
}

/* ════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════ */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

function translateEventType(type: string): string {
  const map: Record<string, string> = {
    RESERVATION_CREATED: 'Reserva Criada',
    RESERVATION_CANCELLED: 'Reserva Cancelada',
    WAITLIST_JOINED: 'Entrada na Lista de Espera',
    WAITLIST_LEFT: 'Saída da Lista de Espera',
    WAITLIST_PROMOTED: 'Promovido da Lista de Espera',
  };
  return map[type] || type;
}

function eventCssClass(type: string): string {
  if (type.includes('CANCELLED')) return 'event-cancelled';
  if (type.includes('PROMOTED')) return 'event-promoted';
  if (type.includes('WAITLIST')) return 'event-waitlist';
  return '';
}

function statusBadgeClass(status: string): string {
  return `badge badge-status-${status.toLowerCase()}`;
}

/* ════════════════════════════════════════════════════════
   Main App Component
   ════════════════════════════════════════════════════════ */

export default function ParkingApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global data
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  // Waitlist prefill (from NO_SPOTS redirect)
  const [waitlistPrefill, setWaitlistPrefill] = useState<{
    sectorId: number;
    plate: string;
    expectedArrival: string;
  } | null>(null);

  // Data loaders
  const loadSectors = useCallback(async () => {
    try {
      setSectors(await api.getSectors());
    } catch {}
  }, []);

  const loadReservations = useCallback(async () => {
    try {
      setReservations(await api.getReservations());
    } catch {}
  }, []);

  const loadRanking = useCallback(async () => {
    try {
      setRanking(await api.getRanking());
    } catch {}
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadSectors(), loadReservations(), loadRanking()]);
  }, [loadSectors, loadReservations, loadRanking]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleNoSpots = (
    sectorId: number,
    plate: string,
    expectedArrival: string,
  ) => {
    setWaitlistPrefill({ sectorId, plate, expectedArrival });
    setActiveTab('waitlist');
  };

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
    { key: 'sectors', label: 'Setores', icon: 'bi-building' },
    { key: 'reservations', label: 'Reservas', icon: 'bi-calendar-check' },
    { key: 'waitlist', label: 'Lista de Espera', icon: 'bi-hourglass-split' },
    { key: 'ranking', label: 'Ranking', icon: 'bi-trophy' },
    { key: 'history', label: 'Histórico', icon: 'bi-clock-history' },
  ];

  return (
    <div className="layout-wrapper">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <i className="bi bi-car-front-fill"></i>
          <h1>Verzel Park</h1>
        </div>
        <div className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`sidebar-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                setSidebarOpen(false);
              }}
            >
              <i className={`bi ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="admin-avatar">
            <i className="bi bi-person-fill"></i>
          </div>
          <div className="admin-info">
            <span className="admin-name">Administrador</span>
            <span className="admin-role">Painel de Gestão</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">
            {tabs.find((t) => t.key === activeTab)?.label}
          </h2>
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <DashboardTab sectors={sectors} reservations={reservations} />
        )}
        {activeTab === 'sectors' && (
          <SectorsTab sectors={sectors} onRefresh={refreshAll} />
        )}
        {activeTab === 'reservations' && (
          <ReservationsTab
            sectors={sectors}
            reservations={reservations}
            onRefresh={refreshAll}
            onNoSpots={handleNoSpots}
          />
        )}
        {activeTab === 'waitlist' && (
          <WaitlistTab
            sectors={sectors}
            prefill={waitlistPrefill}
            onRefresh={refreshAll}
            onClearPrefill={() => setWaitlistPrefill(null)}
          />
        )}
        {activeTab === 'ranking' && <RankingTab ranking={ranking} />}
        {activeTab === 'history' && <HistoryTab />}
      </main>
    </div>
  );
}

function DashboardTab({ sectors, reservations }: { sectors: Sector[], reservations: Reservation[] }) {
  const totalSectors = sectors.length;
  const activeReservations = reservations.filter(r => r.status === 'ACTIVE').length;
  const waitlistCount = reservations.filter(r => r.status === 'WAITING').length;
  
  const totalSpots = sectors.reduce((acc, s) => acc + s.reservableQuota, 0);
  const usedSpots = totalSpots - sectors.reduce((acc, s) => acc + s.availableSpots, 0);
  const occupancyRate = totalSpots > 0 ? Math.round((usedSpots / totalSpots) * 100) : 0;

  return (
    <div>
      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="stat-card">
              <div className="stat-icon blue">
                <i className="bi bi-building"></i>
              </div>
              <div className="stat-details">
                <h3>{totalSectors}</h3>
                <p>Setores</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="stat-card">
              <div className="stat-icon green">
                <i className="bi bi-car-front"></i>
              </div>
              <div className="stat-details">
                <h3>{activeReservations}</h3>
                <p>Reservas</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="stat-card">
              <div className="stat-icon orange">
                <i className="bi bi-people"></i>
              </div>
              <div className="stat-details">
                <h3>{waitlistCount}</h3>
                <p>Espera agora</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card h-100">
            <div className="stat-card">
              <div className="stat-icon purple">
                <i className="bi bi-pie-chart"></i>
              </div>
              <div className="stat-details">
                <h3>{occupancyRate}%</h3>
                <p>Ocupação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">Ocupação por setor</div>
        <div className="card-body p-0">
          <div className="table-responsive-mobile">
            <table className="table">
              <tbody>
                {sectors.map(s => {
                  const used = s.reservableQuota - s.availableSpots;
                  const rate = s.reservableQuota > 0 ? Math.round((used / s.reservableQuota) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <td data-label="Setor">
                        <div className="d-flex align-items-center gap-3">
                          <div className="admin-avatar bg-primary bg-opacity-10 text-primary fw-bold" style={{width: 32, height: 32}}>
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold">{s.name}</div>
                            <small className="text-muted">{s.location}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Ocupação" className="text-end text-md-center">
                        <div className="d-none d-md-inline-block occupancy-bar">
                          <div className={`occupancy-fill ${rate > 90 ? 'full' : rate > 75 ? 'high' : ''}`} style={{width: `${rate}%`}}></div>
                        </div>
                        <span className="fw-bold text-muted small">{used} / {s.reservableQuota} vagas</span>
                      </td>
                      <td data-label="Taxa" className="text-end fw-bold text-primary">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ESTC-1: Sectors Tab
   ════════════════════════════════════════════════════════ */

function SectorsTab({
  sectors,
  onRefresh,
}: {
  sectors: Sector[];
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [quota, setQuota] = useState('');
  const [rate, setRate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await api.createSector({
        name,
        location,
        reservableQuota: parseInt(quota, 10),
        hourlyRate: parseFloat(rate),
      });
      setSuccess('Setor cadastrado com sucesso!');
      setName('');
      setLocation('');
      setQuota('');
      setRate('');
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar setor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-plus-circle me-2"></i>Cadastrar Setor
          </h5>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Setor A"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Localização</label>
                <input
                  type="text"
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Ala Norte"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Cota de Vagas</label>
                <input
                  type="number"
                  className="form-control"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  placeholder="Ex: 20"
                  min="1"
                  step="1"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Tarifa por Hora (R$)</label>
                <input
                  type="number"
                  className="form-control"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Ex: 5.50"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary mt-3"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Cadastrando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1"></i>Cadastrar Setor
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Sector List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-list-ul me-2"></i>Setores Cadastrados
          </h5>
          <span className="badge bg-secondary">{sectors.length}</span>
        </div>
        <div className="card-body">
          {sectors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏗️</div>
              <p>Nenhum setor cadastrado ainda.</p>
              <p className="text-muted">
                Cadastre o primeiro setor usando o formulário acima.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Localização</th>
                    <th>Cota Total</th>
                    <th>Disponíveis</th>
                    <th>Tarifa/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>
                        <strong>{s.name}</strong>
                      </td>
                      <td>{s.location || '—'}</td>
                      <td>{s.reservableQuota}</td>
                      <td>
                        <span
                          className={`badge ${s.availableSpots > 0 ? 'badge-spots-ok' : 'badge-spots-zero'}`}
                        >
                          {s.availableSpots}
                        </span>
                      </td>
                      <td>R$ {s.hourlyRate.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ESTC-2: Reservations Tab
   ════════════════════════════════════════════════════════ */

function ReservationsTab({
  sectors,
  reservations,
  onRefresh,
  onNoSpots,
}: {
  sectors: Sector[];
  reservations: Reservation[];
  onRefresh: () => Promise<void>;
  onNoSpots: (sectorId: number, plate: string, expectedArrival: string) => void;
}) {
  const [plate, setPlate] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [arrival, setArrival] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [noSpotsData, setNoSpotsData] = useState<{
    sectorId: number;
    plate: string;
    expectedArrival: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setNoSpotsData(null);
    setSubmitting(true);

    const isoArrival = arrival ? new Date(arrival).toISOString() : '';

    try {
      await api.createReservation({
        plate,
        sectorId: parseInt(sectorId, 10),
        expectedArrival: isoArrival,
      });
      setSuccess('Reserva criada com sucesso!');
      setPlate('');
      setSectorId('');
      setArrival('');
      await onRefresh();
    } catch (err: any) {
      if (err.code === 'NO_SPOTS') {
        setNoSpotsData({
          sectorId: parseInt(sectorId, 10),
          plate,
          expectedArrival: isoArrival,
        });
        setError(err.message);
      } else {
        setError(err.message || 'Erro ao criar reserva.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Deseja realmente cancelar esta reserva?')) return;
    try {
      await api.cancelReservation(id);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar reserva.');
    }
  };

  return (
    <div>
      {/* Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-plus-circle me-2"></i>Nova Reserva
          </h5>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              {noSpotsData && (
                <div className="mt-2">
                  <button
                    className="btn btn-outline-warning btn-sm"
                    onClick={() =>
                      onNoSpots(
                        noSpotsData.sectorId,
                        noSpotsData.plate,
                        noSpotsData.expectedArrival,
                      )
                    }
                  >
                    <i className="bi bi-hourglass-split me-1"></i>
                    Entrar na Lista de Espera
                  </button>
                </div>
              )}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Placa</label>
                <input
                  type="text"
                  className="form-control"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="Ex: ABC-1234"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Setor</label>
                <select
                  className="form-select"
                  value={sectorId}
                  onChange={(e) => setSectorId(e.target.value)}
                >
                  <option value="">Selecione um setor</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.availableSpots} disponíveis)
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Chegada Prevista</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary mt-3"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Reservando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1"></i>Reservar Vaga
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Reservations List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-journal-text me-2"></i>Reservas
          </h5>
          <span className="badge bg-secondary">{reservations.length}</span>
        </div>
        <div className="card-body">
          {reservations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>Nenhuma reserva registrada ainda.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Placa</th>
                    <th>Setor</th>
                    <th>Chegada Prevista</th>
                    <th>Status</th>
                    <th>Criação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>
                        <strong>{r.plate}</strong>
                      </td>
                      <td>{r.sector.name}</td>
                      <td>{formatDate(r.expectedArrival)}</td>
                      <td>
                        <span className={statusBadgeClass(r.status)}>
                          {r.status}
                        </span>
                      </td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>
                        {r.status === 'ACTIVE' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleCancel(r.id)}
                          >
                            <i className="bi bi-x-circle me-1"></i>Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ESTC-4: Waitlist Tab
   ════════════════════════════════════════════════════════ */

function WaitlistTab({
  sectors,
  prefill,
  onRefresh,
  onClearPrefill,
}: {
  sectors: Sector[];
  prefill: { sectorId: number; plate: string; expectedArrival: string } | null;
  onRefresh: () => Promise<void>;
  onClearPrefill: () => void;
}) {
  const [selectedSector, setSelectedSector] = useState<string>(
    prefill ? String(prefill.sectorId) : '',
  );
  const [plate, setPlate] = useState(prefill?.plate || '');
  const [arrival, setArrival] = useState('');
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Handle prefill from NO_SPOTS
  useEffect(() => {
    if (prefill) {
      setSelectedSector(String(prefill.sectorId));
      setPlate(prefill.plate);
      // Convert ISO to datetime-local format
      if (prefill.expectedArrival) {
        const d = new Date(prefill.expectedArrival);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setArrival(local);
      }
      onClearPrefill();
    }
  }, [prefill, onClearPrefill]);

  // Load waitlist when sector changes
  const loadWaitlist = useCallback(async () => {
    if (!selectedSector) {
      setWaitlist([]);
      return;
    }
    try {
      setWaitlist(await api.getWaitlist(parseInt(selectedSector, 10)));
    } catch {}
  }, [selectedSector]);

  useEffect(() => {
    loadWaitlist();
  }, [loadWaitlist]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const isoArrival = arrival ? new Date(arrival).toISOString() : '';

    try {
      await api.joinWaitlist(parseInt(selectedSector, 10), {
        plate,
        expectedArrival: isoArrival,
      });
      setSuccess('Entrada na lista de espera registrada!');
      setPlate('');
      setArrival('');
      await loadWaitlist();
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar na lista de espera.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async (id: number) => {
    if (!confirm('Deseja realmente sair da lista de espera?')) return;
    try {
      await api.leaveWaitlist(id);
      await loadWaitlist();
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao sair da lista de espera.');
    }
  };

  return (
    <div>
      {/* Sector Selector */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-hourglass-split me-2"></i>Lista de Espera
          </h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Selecione o Setor</label>
            <select
              className="form-select"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              <option value="">Escolha um setor</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.availableSpots} disponíveis)
                </option>
              ))}
            </select>
          </div>

          {selectedSector && (
            <>
              <hr />
              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </div>
              )}

              <h6 className="mb-3">Entrar na fila</h6>
              <form onSubmit={handleJoin}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Placa</label>
                    <input
                      type="text"
                      className="form-control"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      placeholder="Ex: ABC-1234"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Chegada Prevista</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={arrival}
                      onChange={(e) => setArrival(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary mt-3"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Entrando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-1"></i>Entrar na Lista
                    </>
                  )}
                </button>
              </form>

              {/* Waitlist for this sector */}
              <hr />
              <h6 className="mb-3">
                Fila atual{' '}
                <span className="badge bg-secondary ms-2">
                  {waitlist.length}
                </span>
              </h6>
              {waitlist.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <p>Nenhuma placa na lista de espera deste setor.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Posição</th>
                        <th>Placa</th>
                        <th>Chegada Prevista</th>
                        <th>Entrada</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((entry, idx) => (
                        <tr key={entry.id}>
                          <td>
                            <span className="badge bg-secondary">
                              {idx + 1}º
                            </span>
                          </td>
                          <td>
                            <strong>{entry.plate}</strong>
                          </td>
                          <td>{formatDate(entry.expectedArrival)}</td>
                          <td>{formatDate(entry.createdAt)}</td>
                          <td>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleLeave(entry.id)}
                            >
                              <i className="bi bi-box-arrow-right me-1"></i>Sair
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ESTC-3: Ranking Tab
   ════════════════════════════════════════════════════════ */

function RankingTab({ ranking }: { ranking: RankingItem[] }) {
  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-trophy me-2"></i>Ranking de Setores por Reservas
        </h5>
      </div>
      <div className="card-body">
        {ranking.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <p>Nenhuma reserva foi registrada ainda.</p>
            <p className="text-muted">
              O ranking será exibido após a primeira reserva.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Setor</th>
                  <th>Localização</th>
                  <th>Tarifa/Hora</th>
                  <th>Total de Reservas</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, idx) => {
                  const pos = idx + 1;
                  let posClass = 'ranking-other';
                  if (pos === 1) posClass = 'ranking-1';
                  else if (pos === 2) posClass = 'ranking-2';
                  else if (pos === 3) posClass = 'ranking-3';

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={`ranking-position ${posClass}`}>
                          {pos}
                        </span>
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.location || '—'}</td>
                      <td>R$ {item.hourlyRate.toFixed(2)}</td>
                      <td>
                        <span className="badge bg-primary">
                          {item.totalReservations}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ESTC-5: History Tab
   ════════════════════════════════════════════════════════ */

function HistoryTab() {
  const [mode, setMode] = useState<'global' | 'reservation'>('global');
  const [reservationId, setReservationId] = useState('');
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGlobal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await api.getGlobalHistory());
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReservation = async () => {
    if (!reservationId) return;
    setLoading(true);
    setError(null);
    try {
      setEvents(
        await api.getReservationHistory(parseInt(reservationId, 10)),
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar histórico da reserva.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'global') {
      loadGlobal();
    }
  }, [mode, loadGlobal]);

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-clock-history me-2"></i>Histórico de Eventos
        </h5>
      </div>
      <div className="card-body">
        {/* Mode Selector */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <button
            className={`btn btn-sm ${mode === 'global' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setMode('global')}
          >
            <i className="bi bi-globe me-1"></i>Feed Global
          </button>
          <button
            className={`btn btn-sm ${mode === 'reservation' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setMode('reservation')}
          >
            <i className="bi bi-search me-1"></i>Por Reserva
          </button>
        </div>

        {/* Reservation ID input */}
        {mode === 'reservation' && (
          <div className="row g-2 mb-4">
            <div className="col-auto">
              <input
                type="number"
                className="form-control"
                placeholder="ID da Reserva"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                min="1"
              />
            </div>
            <div className="col-auto">
              <button className="btn btn-primary" onClick={loadReservation}>
                <i className="bi bi-search me-1"></i>Buscar
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <p>
              {mode === 'global'
                ? 'Nenhum evento registrado ainda.'
                : 'Nenhum evento encontrado para esta reserva.'}
            </p>
          </div>
        ) : (
          <div>
            {events.map((event) => (
              <div
                key={event.id}
                className={`history-event ${eventCssClass(event.type)}`}
              >
                <div className="history-event-time">
                  {formatDate(event.createdAt)}
                </div>
                <div className="history-event-desc">
                  <span className={statusBadgeClass(event.type.includes('CANCELLED') ? 'cancelled' : event.type.includes('PROMOTED') ? 'promoted' : event.type.includes('WAITLIST') ? 'waiting' : 'active')}>
                    {translateEventType(event.type)}
                  </span>
                  <span className="ms-2">{event.description}</span>
                </div>
                {event.originEvent && (
                  <div className="history-event-origin">
                    <i className="bi bi-arrow-return-right me-1"></i>
                    Originado por: {event.originEvent.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
