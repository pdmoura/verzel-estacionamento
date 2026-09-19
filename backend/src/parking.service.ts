import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import {
  CreateReservationDto,
  CreateSectorDto,
  JoinWaitlistDto,
  ListReservationsQueryDto,
} from './dto';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ParkingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ───────────────────────────────────────────

  private normalizePlate(plate: string): string {
    return (plate ?? '').trim().toUpperCase();
  }

  private parseFutureDate(value: string): Date {
    const arrival = new Date(value);
    if (isNaN(arrival.getTime())) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'INVALID_DATE',
        message: 'Data/hora inválida.',
      });
    }
    if (arrival <= new Date()) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'PAST_DATE',
        message: 'A data/hora prevista deve ser no futuro.',
      });
    }
    return arrival;
  }

  private requirePlate(raw: string): string {
    const plate = this.normalizePlate(raw);
    if (!plate) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'EMPTY_PLATE',
        message: 'A placa é obrigatória.',
      });
    }
    return plate;
  }

  /**
   * Serializable transactions can abort with P2034 when two requests race for
   * the same spot; retrying keeps the invariants without pessimistic locks.
   */
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const isPrismaConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
        if (isPrismaConflict && attempt < maxRetries) continue;
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  private serializable<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.withRetry(() =>
      this.prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }),
    );
  }

  private toNumber(val: unknown): number {
    return typeof val === 'object' && val !== null && 'toNumber' in val
      ? (val as { toNumber: () => number }).toNumber()
      : Number(val);
  }

  private mapSector<T extends { hourlyRate: unknown }>(s: T) {
    return { ...s, hourlyRate: this.toNumber(s.hourlyRate) };
  }

  // ── ESTC-1: Sectors ──────────────────────────────────

  async createSector(data: CreateSectorDto) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'EMPTY_NAME',
        message: 'O nome do setor é obrigatório.',
      });
    }

    if (
      !Number.isFinite(data.reservableQuota) ||
      !Number.isInteger(data.reservableQuota) ||
      data.reservableQuota < 1
    ) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'INVALID_QUOTA',
        message: 'A cota de vagas deve ser um número inteiro maior ou igual a 1.',
      });
    }

    if (!Number.isFinite(data.hourlyRate) || data.hourlyRate < 0) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'INVALID_RATE',
        message: 'A tarifa por hora não pode ser negativa.',
      });
    }

    const sector = await this.prisma.sector.create({
      data: {
        name: data.name.trim(),
        location: (data.location ?? '').trim(),
        reservableQuota: data.reservableQuota,
        hourlyRate: data.hourlyRate,
        availableSpots: data.reservableQuota,
      },
    });

    return this.mapSector(sector);
  }

  async listSectors() {
    const sectors = await this.prisma.sector.findMany({ orderBy: { id: 'asc' } });
    return sectors.map((s) => this.mapSector(s));
  }

  // ── ESTC-2: Reservations ─────────────────────────────

  async createReservation(data: CreateReservationDto) {
    const plate = this.requirePlate(data.plate);
    const arrival = this.parseFutureDate(data.expectedArrival);

    return this.serializable(async (tx) => {
      // Global rule: a plate can hold at most one active reservation
      const activeReservation = await tx.reservation.findFirst({
        where: { plate, status: 'ACTIVE' },
      });
      if (activeReservation) {
        throw new ConflictException({
          statusCode: 409,
          code: 'PLATE_ACTIVE',
          message: 'Esta placa já possui uma reserva ativa.',
        });
      }

      const sector = await tx.sector.findUnique({ where: { id: data.sectorId } });
      if (!sector) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'SECTOR_NOT_FOUND',
          message: 'Setor não encontrado.',
        });
      }
      if (sector.availableSpots <= 0) {
        throw new ConflictException({
          statusCode: 409,
          code: 'NO_SPOTS',
          message: 'Não há vagas disponíveis neste setor.',
        });
      }

      const reservation = await tx.reservation.create({
        data: { plate, sectorId: data.sectorId, expectedArrival: arrival, status: 'ACTIVE' },
      });

      await tx.sector.update({
        where: { id: data.sectorId },
        data: { availableSpots: { decrement: 1 } },
      });

      await tx.historyEvent.create({
        data: {
          type: 'RESERVATION_CREATED',
          description: `Reserva criada para a placa ${plate} no setor ${sector.name}.`,
          reservationId: reservation.id,
        },
      });

      const full = await tx.reservation.findUniqueOrThrow({
        where: { id: reservation.id },
        include: { sector: true },
      });
      return { ...full, sector: this.mapSector(full.sector) };
    });
  }

  async listReservations(filters: ListReservationsQueryDto = {}) {
    const where: Prisma.ReservationWhereInput = {};
    const plate = this.normalizePlate(filters.plate ?? '');
    if (plate) where.plate = { contains: plate, mode: 'insensitive' };
    if (filters.status) where.status = filters.status;

    const reservations = await this.prisma.reservation.findMany({
      where,
      include: { sector: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return reservations.map((r) => ({ ...r, sector: this.mapSector(r.sector) }));
  }

  async cancelReservation(id: number) {
    return this.serializable(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
        include: { sector: true },
      });
      if (!reservation) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reserva não encontrada.',
        });
      }
      if (reservation.status !== 'ACTIVE') {
        throw new ConflictException({
          statusCode: 409,
          code: 'NOT_ACTIVE',
          message: 'Apenas reservas ativas podem ser canceladas.',
        });
      }

      await tx.reservation.update({ where: { id }, data: { status: 'CANCELLED' } });

      const cancelEvent = await tx.historyEvent.create({
        data: {
          type: 'RESERVATION_CANCELLED',
          description: `Reserva da placa ${reservation.plate} no setor ${reservation.sector.name} foi cancelada.`,
          reservationId: id,
        },
      });

      // FIFO promotion: the first WAITING entry whose plate is still eligible
      const waitingEntries = await tx.waitlistEntry.findMany({
        where: { sectorId: reservation.sectorId, status: 'WAITING' },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });

      let promoted = false;

      for (const entry of waitingEntries) {
        const hasActive = await tx.reservation.findFirst({
          where: { plate: entry.plate, status: 'ACTIVE' },
        });
        if (hasActive) {
          await tx.waitlistEntry.update({ where: { id: entry.id }, data: { status: 'LEFT' } });
          await tx.historyEvent.create({
            data: {
              type: 'WAITLIST_LEFT',
              description: `Placa ${entry.plate} removida da lista de espera do setor ${reservation.sector.name} (já possui reserva ativa).`,
              waitlistEntryId: entry.id,
            },
          });
          continue;
        }

        const newReservation = await tx.reservation.create({
          data: {
            plate: entry.plate,
            sectorId: reservation.sectorId,
            expectedArrival: entry.expectedArrival,
            status: 'ACTIVE',
          },
        });

        await tx.waitlistEntry.update({
          where: { id: entry.id },
          data: { status: 'PROMOTED', reservationId: newReservation.id },
        });

        // Carry the waitlist trail into the promoted reservation's history
        await tx.historyEvent.updateMany({
          where: { waitlistEntryId: entry.id },
          data: { reservationId: newReservation.id },
        });

        await tx.historyEvent.create({
          data: {
            type: 'WAITLIST_PROMOTED',
            description: `Placa ${entry.plate} promovida da lista de espera para reserva ativa no setor ${reservation.sector.name}.`,
            reservationId: newReservation.id,
            waitlistEntryId: entry.id,
            originEventId: cancelEvent.id,
          },
        });

        await tx.historyEvent.create({
          data: {
            type: 'RESERVATION_CREATED',
            description: `Reserva criada para a placa ${entry.plate} no setor ${reservation.sector.name} (promoção da lista de espera).`,
            reservationId: newReservation.id,
          },
        });

        promoted = true;
        break;
      }

      if (!promoted) {
        await tx.sector.update({
          where: { id: reservation.sectorId },
          data: { availableSpots: { increment: 1 } },
        });
      }

      return { message: 'Reserva cancelada com sucesso.', promoted };
    });
  }

  // ── ESTC-3: Ranking ──────────────────────────────────

  async getSectorRanking() {
    const totalReservations = await this.prisma.reservation.count();
    if (totalReservations === 0) return [];

    const sectors = await this.prisma.sector.findMany({
      include: { _count: { select: { reservations: true } } },
    });

    return sectors
      .map((s) => ({
        id: s.id,
        name: s.name,
        location: s.location,
        hourlyRate: this.toNumber(s.hourlyRate),
        totalReservations: s._count.reservations,
      }))
      .sort((a, b) => b.totalReservations - a.totalReservations || a.name.localeCompare(b.name));
  }

  // ── ESTC-4: Waitlist ─────────────────────────────────

  async joinWaitlist(sectorId: number, data: JoinWaitlistDto) {
    const plate = this.requirePlate(data.plate);
    const arrival = this.parseFutureDate(data.expectedArrival);

    return this.serializable(async (tx) => {
      const activeReservation = await tx.reservation.findFirst({
        where: { plate, status: 'ACTIVE' },
      });
      if (activeReservation) {
        throw new ConflictException({
          statusCode: 409,
          code: 'PLATE_ACTIVE',
          message: 'Esta placa já possui uma reserva ativa.',
        });
      }

      const sector = await tx.sector.findUnique({ where: { id: sectorId } });
      if (!sector) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'SECTOR_NOT_FOUND',
          message: 'Setor não encontrado.',
        });
      }
      if (sector.availableSpots > 0) {
        throw new ConflictException({
          statusCode: 409,
          code: 'SECTOR_HAS_SPOTS',
          message: 'O setor ainda possui vagas disponíveis. Faça uma reserva direta.',
        });
      }

      const existingEntry = await tx.waitlistEntry.findFirst({
        where: { plate, sectorId, status: 'WAITING' },
      });
      if (existingEntry) {
        throw new ConflictException({
          statusCode: 409,
          code: 'ALREADY_WAITING',
          message: 'Esta placa já está na lista de espera deste setor.',
        });
      }

      const entry = await tx.waitlistEntry.create({
        data: { plate, sectorId, expectedArrival: arrival, status: 'WAITING' },
      });

      await tx.historyEvent.create({
        data: {
          type: 'WAITLIST_JOINED',
          description: `Placa ${plate} entrou na lista de espera do setor ${sector.name}.`,
          waitlistEntryId: entry.id,
        },
      });

      return entry;
    });
  }

  async listWaitlist() {
    const entries = await this.prisma.waitlistEntry.findMany({
      where: { status: 'WAITING' },
      include: { sector: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return entries.map((e) => ({ ...e, sector: this.mapSector(e.sector) }));
  }

  async getSectorWaitlist(sectorId: number) {
    const sector = await this.prisma.sector.findUnique({ where: { id: sectorId } });
    if (!sector) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'SECTOR_NOT_FOUND',
        message: 'Setor não encontrado.',
      });
    }

    return this.prisma.waitlistEntry.findMany({
      where: { sectorId, status: 'WAITING' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async leaveWaitlist(id: number) {
    return this.serializable(async (tx) => {
      const entry = await tx.waitlistEntry.findUnique({
        where: { id },
        include: { sector: true },
      });
      if (!entry) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'ENTRY_NOT_FOUND',
          message: 'Entrada na lista de espera não encontrada.',
        });
      }
      if (entry.status !== 'WAITING') {
        throw new ConflictException({
          statusCode: 409,
          code: 'NOT_WAITING',
          message: 'Apenas entradas com status WAITING podem ser removidas.',
        });
      }

      await tx.waitlistEntry.update({ where: { id }, data: { status: 'LEFT' } });

      await tx.historyEvent.create({
        data: {
          type: 'WAITLIST_LEFT',
          description: `Placa ${entry.plate} saiu voluntariamente da lista de espera do setor ${entry.sector.name}.`,
          waitlistEntryId: id,
        },
      });

      return { message: 'Saída da lista de espera realizada com sucesso.' };
    });
  }

  // ── ESTC-5: History ──────────────────────────────────

  private readonly historyInclude = {
    reservation: { include: { sector: true } },
    waitlistEntry: { include: { sector: true } },
    originEvent: true,
  } satisfies Prisma.HistoryEventInclude;

  async getGlobalHistory() {
    const events = await this.prisma.historyEvent.findMany({
      include: this.historyInclude,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return events.map((e) => this.mapHistoryEvent(e));
  }

  async getReservationHistory(reservationId: number) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'RESERVATION_NOT_FOUND',
        message: 'Reserva não encontrada.',
      });
    }

    const events = await this.prisma.historyEvent.findMany({
      where: { reservationId },
      include: this.historyInclude,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return events.map((e) => this.mapHistoryEvent(e));
  }

  private mapHistoryEvent(
    e: Prisma.HistoryEventGetPayload<{ include: ParkingService['historyInclude'] }>,
  ) {
    return {
      ...e,
      reservation: e.reservation
        ? { ...e.reservation, sector: this.mapSector(e.reservation.sector) }
        : null,
      waitlistEntry: e.waitlistEntry
        ? { ...e.waitlistEntry, sector: this.mapSector(e.waitlistEntry.sector) }
        : null,
    };
  }
}
