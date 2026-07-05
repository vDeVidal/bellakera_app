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
      orderBy: { fecha: 'desc' },
    });
  }

  async obtener(id: number) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
    });
    if (!evento) throw new NotFoundException('Evento no encontrado');
    return evento;
  }

  async crear(data: CreateEventoDto, flyerPath: string | null, idAdmin: number) {
    return this.prisma.evento.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        fecha: new Date(data.fecha),
        precio: data.precio,
        aforo_maximo: data.aforo_maximo,
        estado: data.estado ?? 'ACTIVO',
        imagen_url: flyerPath,
      },
    });
  }

  async actualizar(id: number, data: UpdateEventoDto, flyerPath: string | null) {
    const existente = await this.prisma.evento.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Evento no encontrado');

    // Si llega un flyer nuevo, borramos el anterior del filesystem
    if (flyerPath && existente.imagen_url) {
      this.borrarArchivo(existente.imagen_url);
    }

    return this.prisma.evento.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.fecha !== undefined && { fecha: new Date(data.fecha) }),
        ...(data.precio !== undefined && { precio: data.precio }),
        ...(data.aforo_maximo !== undefined && { aforo_maximo: data.aforo_maximo }),
        ...(data.estado !== undefined && { estado: data.estado }),
        ...(flyerPath && { imagen_url: flyerPath }),
      },
    });
  }

  async eliminar(id: number) {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    if (evento.imagen_url) this.borrarArchivo(evento.imagen_url);

    await this.prisma.evento.delete({ where: { id } });
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