import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ParkingService } from './parking.service';
import {
  CreateSectorBody,
  CreateReservationBody,
  JoinWaitlistBody,
} from './parking.types';

@Controller()
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  // ── ESTC-1: Sectors ──────────────────────────────────

  @Get('sectors')
  listSectors() {
    return this.parkingService.listSectors();
  }

  @Post('sectors')
  createSector(@Body() body: CreateSectorBody) {
    return this.parkingService.createSector(body);
  }

  // ── ESTC-2: Reservations ─────────────────────────────

  @Get('reservations')
  listReservations() {
    return this.parkingService.listReservations();
  }

  @Post('reservations')
  createReservation(@Body() body: CreateReservationBody) {
    return this.parkingService.createReservation(body);
  }

  @Post('reservations/:id/cancel')
  cancelReservation(@Param('id', ParseIntPipe) id: number) {
    return this.parkingService.cancelReservation(id);
  }

  // ── ESTC-3: Ranking ──────────────────────────────────

  @Get('sectors/ranking')
  getSectorRanking() {
    return this.parkingService.getSectorRanking();
  }

  // ── ESTC-4: Waitlist ─────────────────────────────────

  @Get('sectors/:id/waitlist')
  getSectorWaitlist(@Param('id', ParseIntPipe) id: number) {
    return this.parkingService.getSectorWaitlist(id);
  }

  @Post('sectors/:id/waitlist')
  joinWaitlist(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: JoinWaitlistBody,
  ) {
    return this.parkingService.joinWaitlist(id, body);
  }

  @Delete('waitlist/:id')
  leaveWaitlist(@Param('id', ParseIntPipe) id: number) {
    return this.parkingService.leaveWaitlist(id);
  }

  // ── ESTC-5: History ──────────────────────────────────

  @Get('history')
  getGlobalHistory() {
    return this.parkingService.getGlobalHistory();
  }

  @Get('reservations/:id/history')
  getReservationHistory(@Param('id', ParseIntPipe) id: number) {
    return this.parkingService.getReservationHistory(id);
  }
}
