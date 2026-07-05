import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async getPerfil(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { red_social: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const { pin_hash, codigo_sms, ...perfil } = usuario;
    return perfil;
  }

  async actualizarPerfil(id: number, data: any) {
    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    const { pin_hash, codigo_sms, ...perfil } = usuario;
    return perfil;
  }

  async upsertRedSocial(id: number, data: { bio?: string; intereses?: string; instagram?: string }) {
    return this.prisma.redSocial.upsert({
      where: { usuario_id: id },
      update: { ...data },
      create: { usuario_id: id, ...data },
    });
  }

  async getRedSocial(id: number) {
    return this.prisma.redSocial.findUnique({ where: { usuario_id: id } });
  }
}