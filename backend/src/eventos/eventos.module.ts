import { Module, Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('eventos')
class EventosController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.evento.findMany();
  }

  @Post()
  create(@Body() data: any) {
    return this.prisma.evento.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        fecha_evento: new Date(data.fecha_evento),
      },
    });
  }
}

@Module({
  controllers: [EventosController],
  providers: [PrismaService],
})
export class EventosModule {}