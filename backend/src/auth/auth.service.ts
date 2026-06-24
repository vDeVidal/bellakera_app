import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ============================================
  // REGISTRO DE USUARIO (solo usuarios, no admins)
  // ============================================
  async registro(data: {
    telefono: string;
    pin: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento?: string;
  }) {
    const { telefono, pin, nombre, apellido, fecha_nacimiento } = data;

    // Validaciones básicas
    if (!/^\+56\d{9}$/.test(telefono)) {
      throw new BadRequestException('Formato de teléfono inválido. Debe ser +56XXXXXXXXX');
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('El PIN debe ser de 4 dígitos');
    }

    // Verificar que no exista
    const existente = await this.prisma.usuario.findUnique({ where: { telefono } });
    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese teléfono');
    }

    // Hash del PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Generar código de verificación (6 dígitos)
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const codigoExpira = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const usuario = await this.prisma.usuario.create({
      data: {
        telefono,
        pin_hash: pinHash,
        nombre,
        apellido,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        codigo_verificacion: codigo,
        codigo_expira: codigoExpira,
        verificado: false,
        estado: 'activo',
      },
    });

    // En DEV: imprimir código en consola
    console.log(`\n📱 [DEV] Código de verificación para ${telefono}: ${codigo}\n`);

    return {
      mensaje: 'Usuario registrado. Verifica tu cuenta con el código enviado.',
      id_usuario: usuario.id_usuario,
      telefono: usuario.telefono,
    };
  }

  // ============================================
  // VERIFICAR CÓDIGO SMS
  // ============================================
  async verificar(telefono: string, codigo: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { telefono } });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    if (usuario.verificado) {
      throw new BadRequestException('Usuario ya verificado');
    }
    if (!usuario.codigo_verificacion || usuario.codigo_verificacion !== codigo) {
      throw new UnauthorizedException('Código incorrecto');
    }
    if (!usuario.codigo_expira || usuario.codigo_expira < new Date()) {
      throw new UnauthorizedException('Código expirado');
    }

    await this.prisma.usuario.update({
      where: { id_usuario: usuario.id_usuario },
      data: {
        verificado: true,
        codigo_verificacion: null,
        codigo_expira: null,
      },
    });

    return { mensaje: 'Cuenta verificada correctamente' };
  }

  // ============================================
  // REENVIAR CÓDIGO
  // ============================================
  async reenviarCodigo(telefono: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { telefono } });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    if (usuario.verificado) {
      throw new BadRequestException('Usuario ya verificado');
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const codigoExpira = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.usuario.update({
      where: { id_usuario: usuario.id_usuario },
      data: {
        codigo_verificacion: codigo,
        codigo_expira: codigoExpira,
      },
    });

    console.log(`\n📱 [DEV] Nuevo código para ${telefono}: ${codigo}\n`);

    return { mensaje: 'Código reenviado' };
  }

  // ============================================
  // LOGIN UNIFICADO (Usuario + Admin)
  // ============================================
  async login(telefono: string, pin: string) {
    if (!/^\+56\d{9}$/.test(telefono)) {
      throw new BadRequestException('Formato de teléfono inválido');
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('PIN inválido');
    }

    // 1) Buscar primero como ADMIN
    const admin = await this.prisma.administrador.findUnique({
      where: { telefono },
    });

    if (admin) {
      if (!admin.activo) {
        throw new UnauthorizedException('Cuenta de administrador desactivada');
      }
      const pinValido = await bcrypt.compare(pin, admin.pin_hash);
      if (!pinValido) {
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      const payload = {
        sub: admin.id_admin,
        telefono: admin.telefono,
        tipo: 'admin',
        rol: admin.rol,
      };
      const token = await this.jwtService.signAsync(payload, { expiresIn: '30d' });

      return {
        access_token: token,
        tipo: 'admin',
        usuario: {
          id: admin.id_admin,
          telefono: admin.telefono,
          nombre: admin.nombre,
          apellido: admin.apellido,
          rol: admin.rol,
        },
      };
    }

    // 2) Si no es admin, buscar como USUARIO
    const usuario = await this.prisma.usuario.findUnique({
      where: { telefono },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    if (usuario.estado.toLowerCase() !== 'activo') {
      throw new UnauthorizedException('Cuenta desactivada');
    }
    if (!usuario.verificado) {
      throw new UnauthorizedException('Cuenta no verificada. Revisa tu código SMS.');
    }

    const pinValido = await bcrypt.compare(pin, usuario.pin_hash);
    if (!pinValido) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Actualizar último acceso
    await this.prisma.usuario.update({
      where: { id_usuario: usuario.id_usuario },
      data: { ultimo_acceso: new Date() },
    });

    const payload = {
      sub: usuario.id_usuario,
      telefono: usuario.telefono,
      tipo: 'usuario',
    };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '30d' });

    return {
      access_token: token,
      tipo: 'usuario',
      usuario: {
        id: usuario.id_usuario,
        telefono: usuario.telefono,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        foto_perfil_url: usuario.foto_perfil_url,
        puntos_acumulados: usuario.puntos_acumulados,
      },
    };
  }
}