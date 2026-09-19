import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';

const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

@Module({
  imports: [
    // Public API: cap each IP at 120 requests/minute. Relaxed under Jest so
    // the e2e suite can hammer the endpoints.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: isTest ? 100_000 : 120 }]),
  ],
  controllers: [AppController, HealthController, ParkingController],
  providers: [
    AppService,
    PrismaService,
    ParkingService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
