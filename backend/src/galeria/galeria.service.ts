import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GaleriaService {
  constructor(private prisma: PrismaService) {}

  async listar() {
    return this.prisma.galeria.findMany({
      where: { visible: true, estado_moderacion: { not: 'rechazado' } },
      include: {
        usuario: { select: { id_usuario: true, nombre: true, foto_perfil_url: true } },
      },
      orderBy: { fecha_subida: 'desc' },
    });
  }

  async listarPorUsuario(id_usuario: number) {
    return this.prisma.galeria.findMany({
      where: { id_usuario },
      orderBy: { fecha_subida: 'desc' },
    });
  }

  async subir(id_usuario: number, data: { url: string; tipo: string; descripcion?: string; id_evento?: number }) {
    return this.prisma.galeria.create({
      data: {
        id_usuario,
        url: data.url,
        tipo: data.tipo,
        descripcion: data.descripcion,
        id_evento: data.id_evento,
      },
    });
  }

  async eliminar(id_usuario: number, id_media: number) {
    const media = await this.prisma.galeria.findUnique({ where: { id_media } });
    if (!media) throw new NotFoundException('Foto no encontrada');
    if (media.id_usuario !== id_usuario) throw new ForbiddenException('No puedes eliminar esta foto');
    return this.prisma.galeria.delete({ where: { id_media } });
  }

  async toggleLike(id_usuario: number, id_media: number) {
    const existente = await this.prisma.likeGaleria.findUnique({
      where: { id_media_id_usuario: { id_media, id_usuario } },
    });

    if (existente) {
      await this.prisma.likeGaleria.delete({ where: { id_like: existente.id_like } });
      await this.prisma.galeria.update({
        where: { id_media },
        data: { likes_count: { decrement: 1 } },
      });
      return { liked: false };
    } else {
      await this.prisma.likeGaleria.create({ data: { id_media, id_usuario } });
      await this.prisma.galeria.update({
        where: { id_media },
        data: { likes_count: { increment: 1 } },
      });
      return { liked: true };
    }
  }
}