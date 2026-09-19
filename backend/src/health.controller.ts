import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma.service';

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check (API + conexão com o banco)' })
  async check() {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Banco de dados indisponível.',
      });
    }
    return {
      status: 'ok',
      database: 'ok',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  }
}
