import { Module } from '@nestjs/common';
import { GaleriaController } from './galeria.controller';
import { GaleriaService } from './galeria.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [GaleriaController],
  providers: [GaleriaService, PrismaService],
})
export class GaleriaModule {}