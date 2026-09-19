import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Request DTOs. Shape/type validation lives here (class-validator);
 * business rules (future date, duplicated plate, full sector, ...) stay in
 * ParkingService so they can return the domain error codes documented in
 * the README (EMPTY_PLATE, NO_SPOTS, PLATE_ACTIVE, ...).
 */

export class CreateSectorDto {
  @ApiProperty({ example: 'Setor A' })
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ example: 'Ala Norte' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiProperty({ example: 20, description: 'Total de vagas reserváveis (>= 1)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reservableQuota!: number;

  @ApiProperty({ example: 5.5, description: 'Tarifa por hora em R$ (>= 0)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate!: number;
}

export class CreateReservationDto {
  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  @MaxLength(20)
  plate!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  sectorId!: number;

  @ApiProperty({ example: '2026-10-01T14:30:00.000Z', description: 'ISO 8601, no futuro' })
  @IsISO8601()
  expectedArrival!: string;
}

export class JoinWaitlistDto {
  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  @MaxLength(20)
  plate!: string;

  @ApiProperty({ example: '2026-10-01T14:30:00.000Z', description: 'ISO 8601, no futuro' })
  @IsISO8601()
  expectedArrival!: string;
}

export const RESERVATION_STATUSES = ['ACTIVE', 'CANCELLED', 'PROMOTED'] as const;

export class ListReservationsQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por placa (busca parcial, sem distinção de caixa)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  plate?: string;

  @ApiPropertyOptional({ enum: RESERVATION_STATUSES })
  @IsOptional()
  @IsIn(RESERVATION_STATUSES as unknown as string[])
  status?: (typeof RESERVATION_STATUSES)[number];
}
