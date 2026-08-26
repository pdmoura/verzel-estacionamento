import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Estacionamento Rotativo (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Unique prefix for this test run to avoid collisions
  const RUN = `E2E_${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup: delete test data in reverse dependency order
    await prisma.historyEvent.deleteMany({
      where: {
        OR: [
          { reservation: { plate: { startsWith: RUN } } },
          { waitlistEntry: { plate: { startsWith: RUN } } },
        ],
      },
    });
    await prisma.waitlistEntry.deleteMany({
      where: { plate: { startsWith: RUN } },
    });
    await prisma.reservation.deleteMany({
      where: { plate: { startsWith: RUN } },
    });
    await prisma.sector.deleteMany({
      where: { name: { startsWith: RUN } },
    });
    await app.close();
  });

  // Helper: future date
  const futureDate = () =>
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // ── ESTC-1: Sector Tests ───────────────────────────

  describe('ESTC-1: Setores', () => {
    it('should create a sector', async () => {
      const res = await request(app.getHttpServer())
        .post('/sectors')
        .send({
          name: `${RUN}_SETOR_A`,
          location: 'Ala Norte',
          reservableQuota: 2,
          hourlyRate: 5.5,
        })
        .expect(201);

      expect(res.body.name).toBe(`${RUN}_SETOR_A`);
      expect(res.body.availableSpots).toBe(2);
      expect(res.body.hourlyRate).toBe(5.5);
    });

    it('should list sectors', async () => {
      const res = await request(app.getHttpServer())
        .get('/sectors')
        .expect(200);

      const found = res.body.find(
        (s: any) => s.name === `${RUN}_SETOR_A`,
      );
      expect(found).toBeDefined();
    });

    it('should reject empty name', async () => {
      const res = await request(app.getHttpServer())
        .post('/sectors')
        .send({
          name: '',
          location: 'X',
          reservableQuota: 1,
          hourlyRate: 1,
        })
        .expect(400);

      expect(res.body.code).toBe('EMPTY_NAME');
    });

    it('should reject quota < 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/sectors')
        .send({
          name: `${RUN}_BAD`,
          location: 'X',
          reservableQuota: 0,
          hourlyRate: 1,
        })
        .expect(400);

      expect(res.body.code).toBe('INVALID_QUOTA');
    });

    it('should reject negative rate', async () => {
      const res = await request(app.getHttpServer())
        .post('/sectors')
        .send({
          name: `${RUN}_BAD`,
          location: 'X',
          reservableQuota: 1,
          hourlyRate: -1,
        })
        .expect(400);

      expect(res.body.code).toBe('INVALID_RATE');
    });
  });

  // ── ESTC-2: Reservation Tests ──────────────────────

  describe('ESTC-2: Reservas', () => {
    let sectorId: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/sectors')
        .send({
          name: `${RUN}_SETOR_R`,
          location: 'Reserva Test',
          reservableQuota: 2,
          hourlyRate: 10,
        });
      sectorId = res.body.id;
    });

    it('should create a reservation', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({
          plate: `${RUN}_AAA`,
          sectorId,
          expectedArrival: futureDate(),
        })
        .expect(201);

      expect(res.body.plate).toBe(`${RUN}_AAA`);
      expect(res.body.status).toBe('ACTIVE');
    });

    it('should decrement available spots', async () => {
      const res = await request(app.getHttpServer())
        .get('/sectors')
        .expect(200);

      const sector = res.body.find((s: any) => s.id === sectorId);
      expect(sector.availableSpots).toBe(1);
    });

    it('should reject empty plate', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({
          plate: '',
          sectorId,
          expectedArrival: futureDate(),
        })
        .expect(400);

      expect(res.body.code).toBe('EMPTY_PLATE');
    });

    it('should reject past date', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({
          plate: `${RUN}_BBB`,
          sectorId,
          expectedArrival: '2020-01-01T00:00:00.000Z',
        })
        .expect(400);

      expect(res.body.code).toBe('PAST_DATE');
    });

    it('should reject duplicate active plate', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({
          plate: `${RUN}_AAA`,
          sectorId,
          expectedArrival: futureDate(),
        })
        .expect(409);

      expect(res.body.code).toBe('PLATE_ACTIVE');
    });

    it('should reject when no spots available', async () => {
      // Fill last spot
      await request(app.getHttpServer())
        .post('/reservations')
        .send({
          plate: `${RUN}_CCC`,
          sectorId,
          expectedArrival: futureDate(),
        })
        .expect(201);

      // Try one more
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({
          plate: `${RUN}_DDD`,
          sectorId,
          expectedArrival: futureDate(),
        })
        .expect(409);

      expect(res.body.code).toBe('NO_SPOTS');
    });

    it('should cancel a reservation and return spot (no waitlist)', async () => {
      // Cancel the last created reservation (_CCC)
      const listRes = await request(app.getHttpServer())
        .get('/reservations')
        .expect(200);

      const cccReservation = listRes.body.find(
        (r: any) => r.plate === `${RUN}_CCC` && r.status === 'ACTIVE',
      );

      await request(app.getHttpServer())
        .post(`/reservations/${cccReservation.id}/cancel`)
        .expect(201);

      // Check spot returned
      const sectorRes = await request(app.getHttpServer())
        .get('/sectors')
        .expect(200);

      const sector = sectorRes.body.find((s: any) => s.id === sectorId);
      expect(sector.availableSpots).toBe(1);
    });
  });

  // ── ESTC-3: Ranking Tests ─────────────────────────

  describe('ESTC-3: Ranking', () => {
    it('should return ranking ordered by reservation count', async () => {
      const res = await request(app.getHttpServer())
        .get('/sectors/ranking')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 1) {
        expect(res.body[0].totalReservations).toBeGreaterThanOrEqual(
          res.body[1].totalReservations,
        );
      }
    });
  });

  // ── ESTC-4: Waitlist Tests ─────────────────────────

  describe('ESTC-4: Lista de Espera', () => {
    let sectorId: number;
    let firstReservationId: number;

    beforeAll(async () => {
      // Create a sector with 1 spot
      const sRes = await request(app.getHttpServer())
        .post('/sectors')
        .send({
          name: `${RUN}_SETOR_W`,
          location: 'Waitlist Test',
          reservableQuota: 1,
          hourlyRate: 8,
        });
      sectorId = sRes.body.id;

      // Fill the only spot
      const rRes = await request(app.getHttpServer())
        .post('/reservations')
        .send({
          plate: `${RUN}_W1`,
          sectorId,
          expectedArrival: futureDate(),
        });
      firstReservationId = rRes.body.id;
    });

    it('should join waitlist when sector is full', async () => {
      const res = await request(app.getHttpServer())
        .post(`/sectors/${sectorId}/waitlist`)
        .send({
          plate: `${RUN}_W2`,
          expectedArrival: futureDate(),
        })
        .expect(201);

      expect(res.body.status).toBe('WAITING');
    });

    it('should reject plate with active reservation from waitlist', async () => {
      const res = await request(app.getHttpServer())
        .post(`/sectors/${sectorId}/waitlist`)
        .send({
          plate: `${RUN}_W1`,
          expectedArrival: futureDate(),
        })
        .expect(409);

      expect(res.body.code).toBe('PLATE_ACTIVE');
    });

    it('should reject duplicate waitlist entry', async () => {
      const res = await request(app.getHttpServer())
        .post(`/sectors/${sectorId}/waitlist`)
        .send({
          plate: `${RUN}_W2`,
          expectedArrival: futureDate(),
        })
        .expect(409);

      expect(res.body.code).toBe('ALREADY_WAITING');
    });

    it('should list waitlist in FIFO order', async () => {
      // Add another to waitlist
      await request(app.getHttpServer())
        .post(`/sectors/${sectorId}/waitlist`)
        .send({
          plate: `${RUN}_W3`,
          expectedArrival: futureDate(),
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/sectors/${sectorId}/waitlist`)
        .expect(200);

      expect(res.body.length).toBe(2);
      expect(res.body[0].plate).toBe(`${RUN}_W2`);
      expect(res.body[1].plate).toBe(`${RUN}_W3`);
    });

    it('should allow voluntary leave from waitlist', async () => {
      const wlRes = await request(app.getHttpServer())
        .get(`/sectors/${sectorId}/waitlist`)
        .expect(200);

      const w3Entry = wlRes.body.find(
        (e: any) => e.plate === `${RUN}_W3`,
      );

      await request(app.getHttpServer())
        .delete(`/waitlist/${w3Entry.id}`)
        .expect(200);

      // Check only W2 remains
      const afterRes = await request(app.getHttpServer())
        .get(`/sectors/${sectorId}/waitlist`)
        .expect(200);

      expect(afterRes.body.length).toBe(1);
      expect(afterRes.body[0].plate).toBe(`${RUN}_W2`);
    });

    it('should promote first waitlist entry on cancellation', async () => {
      // Cancel the active reservation
      await request(app.getHttpServer())
        .post(`/reservations/${firstReservationId}/cancel`)
        .expect(201);

      // W2 should now have an active reservation
      const reservationsRes = await request(app.getHttpServer())
        .get('/reservations')
        .expect(200);

      const w2Reservation = reservationsRes.body.find(
        (r: any) => r.plate === `${RUN}_W2` && r.status === 'ACTIVE',
      );
      expect(w2Reservation).toBeDefined();

      // Waitlist should be empty
      const wlRes = await request(app.getHttpServer())
        .get(`/sectors/${sectorId}/waitlist`)
        .expect(200);

      expect(wlRes.body.length).toBe(0);

      // Sector spots should remain 0 (promoted, not freed)
      const sectorRes = await request(app.getHttpServer())
        .get('/sectors')
        .expect(200);

      const sector = sectorRes.body.find((s: any) => s.id === sectorId);
      expect(sector.availableSpots).toBe(0);
    });
  });

  // ── ESTC-5: History Tests ──────────────────────────

  describe('ESTC-5: Histórico', () => {
    it('should have global history events', async () => {
      const res = await request(app.getHttpServer())
        .get('/history')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Chronological order
      for (let i = 1; i < res.body.length; i++) {
        expect(
          new Date(res.body[i].createdAt).getTime(),
        ).toBeGreaterThanOrEqual(
          new Date(res.body[i - 1].createdAt).getTime(),
        );
      }
    });

    it('should show reservation history with creation event', async () => {
      // Get any reservation
      const reservations = await request(app.getHttpServer())
        .get('/reservations')
        .expect(200);

      const anyReservation = reservations.body[0];

      const res = await request(app.getHttpServer())
        .get(`/reservations/${anyReservation.id}/history`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // At least one RESERVATION_CREATED event
      const hasCreated = res.body.some(
        (e: any) => e.type === 'RESERVATION_CREATED',
      );
      expect(hasCreated).toBe(true);
    });

    it('should have promotion event with originEventId', async () => {
      const historyRes = await request(app.getHttpServer())
        .get('/history')
        .expect(200);

      const promotionEvent = historyRes.body.find(
        (e: any) => e.type === 'WAITLIST_PROMOTED',
      );

      if (promotionEvent) {
        expect(promotionEvent.originEventId).toBeTruthy();
        expect(promotionEvent.originEvent).toBeDefined();
        expect(promotionEvent.originEvent.type).toBe(
          'RESERVATION_CANCELLED',
        );
      }
    });

    it('should return empty array for non-existent reservation', async () => {
      const res = await request(app.getHttpServer())
        .get('/reservations/999999/history')
        .expect(404);

      expect(res.body.code).toBe('RESERVATION_NOT_FOUND');
    });
  });

  // ── Health check ───────────────────────────────────

  it('GET / should return status', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.body.status).toBeDefined();
  });
});
