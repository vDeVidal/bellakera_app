import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GaleriaController } from './galeria.controller';
import { GaleriaService } from './galeria.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [GaleriaController],
  providers: [GaleriaService, PrismaService],
})
export class GaleriaModule {}