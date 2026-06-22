import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private sms: SmsService,
  ) {}

  // PASO 1: Registro inicial (solo teléfono + PIN)
  async registrar(telefono: string, pin: string) {
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('El PIN debe ser de 4 dígitos');
    }

    if (!telefono.startsWith('+')) {
      throw new BadRequestException('El teléfono debe incluir código de país (ej: +56912345678)');
    }

    const existente = await this.prisma.usuario.findUnique({ where: { telefono } });

    // Si existe y ya está verificado, error
    if (existente && existente.verificado) {
      throw new ConflictException('Este teléfono ya está registrado');
    }

    const pin_hash = await bcrypt.hash(pin, 10);
    const codigo = this.sms.generarCodigo();
    const codigo_expira = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Si existe pero NO verificado, actualizamos (puede reintentar)
    if (existente) {
      await this.prisma.usuario.update({
        where: { telefono },
        data: { pin_hash, codigo_verificacion: codigo, codigo_expira },
      });
    } else {
      await this.prisma.usuario.create({
        data: {
          telefono,
          pin_hash,
          codigo_verificacion: codigo,
          codigo_expira,
          estado: 'pendiente',
        },
      });
    }

    await this.sms.enviarCodigo(telefono, codigo);

    return {
      message: 'Código de verificación enviado',
      telefono,
    };
  }

  // PASO 2: Verificar código SMS
  async verificar(telefono: string, codigo: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { telefono } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (usuario.verificado) throw new BadRequestException('Usuario ya verificado');

    if (usuario.codigo_verificacion !== codigo) {
      throw new UnauthorizedException('Código incorrecto');
    }

    if (!usuario.codigo_expira || usuario.codigo_expira < new Date()) {
      throw new UnauthorizedException('Código expirado, solicita uno nuevo');
    }

    const actualizado = await this.prisma.usuario.update({
      where: { telefono },
      data: {
        verificado: true,
        estado: 'activo',
        codigo_verificacion: null,
        codigo_expira: null,
        ultimo_acceso: new Date(),
      },
    });

    return this.generarToken(actualizado);
  }

  // PASO 3: Reenviar código
  async reenviarCodigo(telefono: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { telefono } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (usuario.verificado) throw new BadRequestException('Usuario ya verificado');

    const codigo = this.sms.generarCodigo();
    const codigo_expira = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.usuario.update({
      where: { telefono },
      data: { codigo_verificacion: codigo, codigo_expira },
    });

    await this.sms.enviarCodigo(telefono, codigo);

    return { message: 'Nuevo código enviado' };
  }

  // LOGIN
  async login(telefono: string, pin: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { telefono } });
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    if (!usuario.verificado) {
      throw new UnauthorizedException('Debes verificar tu cuenta primero');
    }

    if (usuario.estado === 'suspendido') {
      throw new UnauthorizedException('Cuenta suspendida');
    }

    const valido = await bcrypt.compare(pin, usuario.pin_hash);
    if (!valido) throw new UnauthorizedException('Credenciales inválidas');

    await this.prisma.usuario.update({
      where: { telefono },
      data: { ultimo_acceso: new Date() },
    });

    return this.generarToken(usuario);
  }

  private generarToken(usuario: any) {
    const payload = { sub: usuario.id_usuario, telefono: usuario.telefono };
    const token = this.jwt.sign(payload);

    return {
      access_token: token,
      usuario: {
        id: usuario.id_usuario,
        telefono: usuario.telefono,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        foto_perfil_url: usuario.foto_perfil_url,
      },
    };
  }
}