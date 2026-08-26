import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';

@Module({
  imports: [],
  controllers: [AppController, ParkingController],
  providers: [AppService, PrismaService, ParkingService],
})
export class AppModule {}
