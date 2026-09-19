import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateReservationDto,
  CreateSectorDto,
  JoinWaitlistDto,
  ListReservationsQueryDto,
} from './dto';
import { ParkingService } from './parking.service';

const DOMAIN_ERROR = { description: 'Erro de domínio: { statusCode, code, message }' };

@Controller()
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  // ── ESTC-1: Sectors ──────────────────────────────────

  @Get('sectors')
  @ApiTags('sectors')
  @ApiOperation({ summary: 'Lista os setores com vagas disponíveis' })
  listSectors() {
    return this.parkingService.listSectors();
  }

  @Post('sectors')
  @ApiTags('sectors')
  @ApiOperation({ summary: 'Cadastra um setor' })
  @ApiResponse({ status: 400, ...DOMAIN_ERROR })
  createSector(@Body() body: CreateSectorDto) {
    return this.parkingService.createSector(body);
  }

  // ── ESTC-3: Ranking (static route declared before sectors/:id) ──

  @Get('sectors/ranking')
  @ApiTags('sectors')
  @ApiOperation({ summary: 'Ranking de setores por total de reservas' })
  getSectorRanking() {
    return this.parkingService.getSectorRanking();
  }

  // ── ESTC-2: Reservations ─────────────────────────────

  @Get('reservations')
  @ApiTags('reservations')
  @ApiOperation({ summary: 'Lista reservas (filtros opcionais por placa e status)' })
  listReservations(@Query() query: ListReservationsQueryDto) {
    return this.parkingService.listReservations(query);
  }

  @Post('reservations')
  @ApiTags('reservations')
  @ApiOperation({ summary: 'Cria uma reserva ativa (decrementa as vagas do setor)' })
  @ApiResponse({ status: 400, ...DOMAIN_ERROR })
  @ApiResponse({ status: 404, ...DOMAIN_ERROR })
  @ApiResponse({ status: 409, description: 'PLATE_ACTIVE ou NO_SPOTS' })
  createReservation(@Body() body: CreateReservationDto) {
    return this.parkingService.createReservation(body);
  }

  @Post('reservations/:id/cancel')
  @ApiTags('reservations')
  @ApiOperation({
    summary: 'Cancela uma reserva; promove o primeiro da lista de espera ou devolve a vaga',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 404, ...DOMAIN_ERROR })
  @ApiResponse({ status: 409, description: 'NOT_ACTIVE' })
  cancelReservation(@Param('id', ParseIntPipe) id: number) {
    return this.parkingService.cancelReservation(id);
  }

  // ── ESTC-4: Waitlist ─────────────────────────────────

  @Get('waitlist')
  @ApiTags('waitlist')
  @ApiOperation({ summary: 'Todas as placas aguardando, em todos os setores (FIFO)' })
  listWaitlist() {
    return this.parkingService.listWaitlist();
  }

  @Get('sectors/:id/waitlist')
  @ApiTags('waitlist')
  @ApiOperation({ summary: 'Lista de espera de um setor (FIFO)' })
  @ApiParam({ name: 'id', type: Number })
  getSectorWaitlist(@Param('id', ParseIntPipe) id: number) {
    return this.parkingService.getSectorWaitlist(id);
  }

  @Post('sectors/:id/waitlist')
  @ApiTags('waitlist')
  @ApiOperation({ summary: 'Entra na lista de espera de um setor lotado' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 409, description: 'PLATE_ACTIVE, SECTOR_HAS_SPOTS ou ALREADY_WAITING' })
  joinWaitlist(@Param('id', ParseIntPipe) id: number, @Body() body: JoinWaitlistDto) {
    return this.parkingService.joinWaitlist(id, body);
  }

  @Delete('waitlist/:id')
  @ApiTags('waitlist')
  @ApiOperation({ summary: 'Sai voluntariamente da lista de espera' })
  @ApiParam({ name: 'id', type: Number })
  leaveWaitlist(@Param('id', ParseIntPipe) id: number) {
    return this.parkingService.leaveWaitlist(id);
  }

  // ── ESTC-5: History ──────────────────────────────────

  @Get('history')
  @ApiTags('history')
  @ApiOperation({ summary: 'Histórico global de eventos (ordem cronológica)' })
  getGlobalHistory() {
    return this.parkingService.getGlobalHistory();
  }

  @Get('reservations/:id/history')
  @ApiTags('history')
  @ApiOperation({ summary: 'Histórico de uma reserva, incluindo o evento de origem de cada promoção' })
  @ApiParam({ name: 'id', type: Number })
  getReservationHistory(@Param('id', ParseIntPipe) id: number) {
    return this.parkingService.getReservationHistory(id);
  }
}
