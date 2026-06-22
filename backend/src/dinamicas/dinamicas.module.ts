import { Module, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('dinamicas')
@UseGuards(AuthGuard)
class DinamicasController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listar() {
    return this.prisma.dinamica.findMany({
      where: { estado: { in: ['programada', 'activa'] } },
      orderBy: { fecha_inicio: 'asc' },
    });
  }

  @Get(':id/ranking')
  async ranking(@Param('id') id: string) {
    return this.prisma.participacion.findMany({
      where: { id_dinamica: +id },
      include: {
        usuario: { select: { nombre: true, apellido: true, foto_perfil_url: true } },
      },
      orderBy: { puntaje: 'desc' },
      take: 10,
    });
  }
}

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [DinamicasController],
  providers: [PrismaService],
})
export class DinamicasModule {}