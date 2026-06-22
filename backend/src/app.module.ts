import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EventosModule } from './eventos/eventos.module';
import { GaleriaModule } from './galeria/galeria.module';
import { DinamicasModule } from './dinamicas/dinamicas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsuariosModule,
    EventosModule,
    GaleriaModule,
    DinamicasModule,
  ],
})
export class AppModule {}