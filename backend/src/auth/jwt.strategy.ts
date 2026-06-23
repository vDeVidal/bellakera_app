import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  // Lo que retorne acá será req.user en los controllers
  async validate(payload: any) {
    return {
      sub: payload.sub,
      telefono: payload.telefono,
      tipo: payload.tipo, // 'usuario' | 'admin'
      rol: payload.rol,   // solo si es admin
    };
  }
}