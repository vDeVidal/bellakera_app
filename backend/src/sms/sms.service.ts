import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async enviarCodigo(telefono: string, codigo: string): Promise<void> {
    // En desarrollo solo logueamos
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`📱 [DEV MODE] SMS a ${telefono}: Tu código BELLAKERA es ${codigo}`);
      return;
    }

    // En producción usar Twilio (descomentar e instalar twilio):
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    // await client.messages.create({
    //   body: `Tu código BELLAKERA es: ${codigo}`,
    //   from: process.env.TWILIO_FROM,
    //   to: telefono,
    // });
  }

  generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}