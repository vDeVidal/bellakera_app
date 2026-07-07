import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GaleriaService {
  constructor(private prisma: PrismaService) {}

  async listarFeed(idUsuarioActual: number | null) {
    const items = await this.prisma.galeria.findMany({
      where: { aprobado: true },
      orderBy: { fecha: 'desc' },
      include: {
        usuario: {
          select: { id: true, nombre: true, avatar_url: true },
        },
        evento: { select: { id: true, nombre: true } },
        likes: idUsuarioActual
          ? { where: { usuario_id: idUsuarioActual }, select: { id: true } }
          : false,
        _count: { select: { likes: true } },
      },
    });

    // Añadir bandera "liked_by_me"
    return items.map((it: any) => ({
      ...it,
      likes_count: it._count?.likes ?? 0,
      liked_by_me: Array.isArray(it.likes) && it.likes.length > 0,
      likes: undefined,
      _count: undefined,
    }));
  }

  async crear(idUsuario: number, imagen_url: string, descripcion?: string, idEvento?: number) {
    return this.prisma.galeria.create({
      data: {
        usuario_id: idUsuario,
        imagen_url,
        descripcion,
        evento_id: idEvento ?? null,
      },
    });
  }

  async toggleLike(idGaleria: number, idUsuario: number) {
    const existente = await this.prisma.likeGaleria.findUnique({
      where: { usuario_id_galeria_id: { usuario_id: idUsuario, galeria_id: idGaleria } },
    });

    if (existente) {
      await this.prisma.likeGaleria.delete({ where: { id: existente.id } });
      return { liked: false };
    } else {
      await this.prisma.likeGaleria.create({
        data: { galeria_id: idGaleria, usuario_id: idUsuario },
      });
      return { liked: true };
    }
  }

  async eliminar(idGaleria: number, user: { sub: number; tipo: string }) {
    const media = await this.prisma.galeria.findUnique({ where: { id: idGaleria } });
    if (!media) throw new NotFoundException('Imagen no encontrada');

    const esDueño = user.tipo === 'usuario' && media.usuario_id === user.sub;
    const esAdmin = user.tipo === 'admin';
    if (!esDueño && !esAdmin) {
      throw new ForbiddenException('No tienes permiso para eliminar esta imagen');
    }

    this.borrarArchivo(media.imagen_url);
    await this.prisma.galeria.delete({ where: { id: idGaleria } });
    return { mensaje: 'Imagen eliminada' };
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