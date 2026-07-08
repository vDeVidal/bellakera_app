import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';
import * as fs from 'fs';
import * as path from 'path';

// Estados válidos (única fuente de verdad)
const ESTADOS_VALIDOS = ['ACTIVO', 'CERRADO', 'CANCELADO'] as const;
type EstadoEvento = typeof ESTADOS_VALIDOS[number];

@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService) { }

  /**
   * Normaliza el estado a mayúsculas y valida que sea uno permitido.
   * Retorna undefined si no viene, para poder usarlo en updates parciales.
   */
  private normalizarEstado(estado?: string): EstadoEvento | undefined {
    if (!estado) return undefined;
    const upper = estado.toUpperCase() as EstadoEvento;
    if (!ESTADOS_VALIDOS.includes(upper)) {
      throw new NotFoundException(
        `Estado inválido: ${estado}. Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`,
      );
    }
    return upper;
  }

  async listar(filtros?: { estado?: string; search?: string }) {
    const estado = this.normalizarEstado(filtros?.estado);

    return this.prisma.evento.findMany({
      where: {
        ...(estado && {
          estado: { equals: estado, mode: 'insensitive' },
        }),
        ...(filtros?.search && {
          nombre: { contains: filtros.search, mode: 'insensitive' },
        }),
      },
      orderBy: { fecha: 'desc' },
    });
  }

  async obtener(id: number) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ventas: true },
        },
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
        fecha: new Date(data.fecha),
        precio: Number(data.precio),                 // fuerza a number
        aforo_maximo: data.aforo_maximo ? Number(data.aforo_maximo) : null,
        estado: this.normalizarEstado(data.estado) ?? 'ACTIVO',
        imagen_url: flyerPath,
      },
    });
  }

  async actualizar(id: number, data: UpdateEventoDto, flyerPath: string | null) {
    const existente = await this.prisma.evento.findUnique({ where: { id } });
    console.log('🔧 [Update Evento] id:', id, 'data recibida:', data);
    if (!existente) throw new NotFoundException('Evento no encontrado');

    // Si llega un flyer nuevo, borramos el anterior del filesystem
    if (flyerPath && existente.imagen_url) {
      this.borrarArchivo(existente.imagen_url);
    }

    const estadoNormalizado = this.normalizarEstado(data.estado);

    return this.prisma.evento.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.fecha !== undefined && { fecha: new Date(data.fecha) }),
        ...(data.precio !== undefined && { precio: Number(data.precio) }),
        ...(data.aforo_maximo !== undefined && {
          aforo_maximo: data.aforo_maximo ? Number(data.aforo_maximo) : null,
        }),
        ...(estadoNormalizado !== undefined && { estado: estadoNormalizado }),
        ...(flyerPath && { imagen_url: flyerPath }),
      },
    });
  }

  async eliminar(id: number) {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    if (evento.imagen_url) this.borrarArchivo(evento.imagen_url);

    // Eliminar en cascada: primero los detalles, luego las ventas, luego el evento
    await this.prisma.$transaction(async (tx) => {
      // 1. Obtener IDs de ventas del evento
      const ventas = await tx.venta.findMany({
        where: { evento_id: id },
        select: { id: true },
      });
      const ventaIds = ventas.map((v) => v.id);

      // 2. Eliminar detalles de esas ventas
      if (ventaIds.length > 0) {
        await tx.detalleVenta.deleteMany({ where: { venta_id: { in: ventaIds } } });
      }

      // 3. Eliminar las ventas
      await tx.venta.deleteMany({ where: { evento_id: id } });

      // 4. Eliminar cualquier galería del evento
      await tx.galeria.deleteMany({ where: { evento_id: id } });

      // 5. Finalmente eliminar el evento
      await tx.evento.delete({ where: { id } });
    });

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