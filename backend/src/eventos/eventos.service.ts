import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService) {}

  async listar() {
    return this.prisma.evento.findMany({
      orderBy: { fecha_evento: 'desc' },
      include: {
        admin_creador: {
          select: { nombre: true, apellido: true },
        },
      },
    });
  }

  async obtener(id: number) {
    const evento = await this.prisma.evento.findUnique({
      where: { id_evento: id },
      include: {
        admin_creador: { select: { nombre: true, apellido: true } },
      },
    });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    return evento;
  }

  async crear(data: CreateEventoDto, flyerPath: string | null, idAdmin: number) {
    return this.prisma.evento.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        fecha_evento: new Date(data.fecha_evento),
        estado: data.estado ?? 'proximo',
        flyer_url: flyerPath,
        id_admin_creador: idAdmin,
      },
    });
  }

  async actualizar(id: number, data: UpdateEventoDto, flyerPath: string | null) {
    const existente = await this.prisma.evento.findUnique({ where: { id_evento: id } });
    if (!existente) throw new NotFoundException('Evento no encontrado');

    // Si llega un flyer nuevo, borramos el anterior del filesystem
    if (flyerPath && existente.flyer_url) {
      this.borrarArchivo(existente.flyer_url);
    }

    return this.prisma.evento.update({
      where: { id_evento: id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.fecha_evento !== undefined && { fecha_evento: new Date(data.fecha_evento) }),
        ...(data.estado !== undefined && { estado: data.estado }),
        ...(flyerPath && { flyer_url: flyerPath }),
      },
    });
  }

  async eliminar(id: number) {
    const evento = await this.prisma.evento.findUnique({ where: { id_evento: id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    if (evento.flyer_url) this.borrarArchivo(evento.flyer_url);

    await this.prisma.evento.delete({ where: { id_evento: id } });
    return { mensaje: 'Evento eliminado' };
  }

  private borrarArchivo(urlRelativa: string) {
    try {
      const fileName = urlRelativa.replace('/uploads/', '');
      const fullPath = path.join(process.cwd(), 'uploads', fileName);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (e) {
      console.warn('No se pudo borrar archivo:', e);
    }
  }
}