import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('registro')
  registro(@Body() body: any) {
    return this.auth.registro(body);
  }

  @Post('verificar')
  verificar(@Body() body: { telefono: string; codigo: string }) {
    return this.auth.verificar(body.telefono, body.codigo);
  }

  @Post('login')
  login(@Body() body: { telefono: string; pin: string }) {
    return this.auth.login(body.telefono, body.pin);
  }

  @Post('reenviar-codigo')
  reenviarCodigo(@Body() body: { telefono: string }) {
    return this.auth.reenviarCodigo(body.telefono);
  }

  // 🔐 Devuelve info fresca del usuario/admin actual
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    const { sub, tipo } = req.user;

    if (tipo === 'admin') {
      const admin = await this.prisma.administrador.findUnique({
        where: { id_admin: sub },
        select: {
          id_admin: true,
          telefono: true,
          nombre: true,
          apellido: true,
          rol: true,
          activo: true,
        },
      });
      return { tipo: 'admin', usuario: admin };
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: sub },
      select: {
        id_usuario: true,
        telefono: true,
        nombre: true,
        apellido: true,
        foto_perfil_url: true,
        puntos_acumulados: true,
        estado: true,
        verificado: true,
      },
    });
    return { tipo: 'usuario', usuario };
  }
}