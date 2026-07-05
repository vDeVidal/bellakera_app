import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EventosModule } from './eventos/eventos.module';
import { GaleriaModule } from './galeria/galeria.module';
import { DinamicasModule } from './dinamicas/dinamicas.module';
import { SmsModule } from './sms/sms.module';
import { ProductosModule } from './productos/productos.module';
import { VentasModule } from './ventas/ventas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    EventosModule,
    GaleriaModule,
    DinamicasModule,
    SmsModule,
    ProductosModule,
    VentasModule,
  ],
})
export class AppModule { }