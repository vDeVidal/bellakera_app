import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async getPerfil(id_usuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario },
      include: { redes_sociales: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const { pin_hash, codigo_verificacion, ...perfil } = usuario;
    return perfil;
  }

  async actualizarPerfil(id_usuario: number, data: any) {
    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.apellido !== undefined) updateData.apellido = data.apellido;
    if (data.foto_perfil_url !== undefined) updateData.foto_perfil_url = data.foto_perfil_url;
    if (data.fecha_nacimiento !== undefined) {
      updateData.fecha_nacimiento = new Date(data.fecha_nacimiento);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id_usuario },
      data: updateData,
    });

    const { pin_hash, codigo_verificacion, ...perfil } = usuario;
    return perfil;
  }

  async agregarRedSocial(id_usuario: number, data: { plataforma: string; username: string; url?: string }) {
    return this.prisma.redSocial.create({
      data: { id_usuario, ...data },
    });
  }

  async eliminarRedSocial(id_usuario: number, id_red: number) {
    const red = await this.prisma.redSocial.findFirst({
      where: { id_red, id_usuario },
    });
    if (!red) throw new NotFoundException('Red social no encontrada');
    return this.prisma.redSocial.delete({ where: { id_red } });
  }

  async listarRedesSociales(id_usuario: number) {
    return this.prisma.redSocial.findMany({ where: { id_usuario } });
  }
}