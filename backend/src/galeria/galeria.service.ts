import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GaleriaService {
  constructor(private prisma: PrismaService) {}

  async listarFeed(idUsuarioActual: number | null) {
    const items = await this.prisma.galeria.findMany({
      where: { visible: true, estado_moderacion: 'aprobado' },
      orderBy: { fecha_subida: 'desc' },
      include: {
        usuario: {
          select: { id_usuario: true, nombre: true, apellido: true, foto_perfil_url: true },
        },
        evento: { select: { id_evento: true, nombre: true } },
        likes: idUsuarioActual
          ? { where: { id_usuario: idUsuarioActual }, select: { id_like: true } }
          : false,
      },
    });

    // Añadir bandera "liked_by_me"
    return items.map((it: any) => ({
      ...it,
      liked_by_me: Array.isArray(it.likes) && it.likes.length > 0,
      likes: undefined,
    }));
  }

  async crear(idUsuario: number, url: string, descripcion?: string, idEvento?: number) {
    return this.prisma.galeria.create({
      data: {
        id_usuario: idUsuario,
        url,
        descripcion,
        id_evento: idEvento ?? null,
        tipo: 'imagen',
      },
    });
  }

  async toggleLike(idMedia: number, idUsuario: number) {
    const existente = await this.prisma.likeGaleria.findUnique({
      where: { id_media_id_usuario: { id_media: idMedia, id_usuario: idUsuario } },
    });

    if (existente) {
      await this.prisma.likeGaleria.delete({ where: { id_like: existente.id_like } });
      await this.prisma.galeria.update({
        where: { id_media: idMedia },
        data: { likes_count: { decrement: 1 } },
      });
      return { liked: false };
    } else {
      await this.prisma.likeGaleria.create({
        data: { id_media: idMedia, id_usuario: idUsuario },
      });
      await this.prisma.galeria.update({
        where: { id_media: idMedia },
        data: { likes_count: { increment: 1 } },
      });
      return { liked: true };
    }
  }

  async eliminar(idMedia: number, user: { sub: number; tipo: string }) {
    const media = await this.prisma.galeria.findUnique({ where: { id_media: idMedia } });
    if (!media) throw new NotFoundException('Imagen no encontrada');

    const esDueño = user.tipo === 'usuario' && media.id_usuario === user.sub;
    const esAdmin = user.tipo === 'admin';
    if (!esDueño && !esAdmin) {
      throw new ForbiddenException('No tienes permiso para eliminar esta imagen');
    }

    this.borrarArchivo(media.url);
    await this.prisma.galeria.delete({ where: { id_media: idMedia } });
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