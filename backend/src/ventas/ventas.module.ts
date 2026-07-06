import { Module } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { AuthModule } from '../auth/auth.module';
import { VentasController } from './ventas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [VentasController],
    providers: [VentasService],
    exports: [VentasService],
})
export class VentasModule { }