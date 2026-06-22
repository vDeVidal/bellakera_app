import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('registro')
  registro(@Body() body: { telefono: string; pin: string }) {
    return this.auth.registrar(body.telefono, body.pin);
  }

  @Post('verificar')
  verificar(@Body() body: { telefono: string; codigo: string }) {
    return this.auth.verificar(body.telefono, body.codigo);
  }

  @Post('reenviar-codigo')
  reenviar(@Body() body: { telefono: string }) {
    return this.auth.reenviarCodigo(body.telefono);
  }

  @Post('login')
  login(@Body() body: { telefono: string; pin: string }) {
    return this.auth.login(body.telefono, body.pin);
  }
}