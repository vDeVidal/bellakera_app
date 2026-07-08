import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,   // ← convierte strings de FormData a number/bool automáticamente
      },
    }),
  );

  // 👇 process.cwd() = /app (donde está el package.json)
  // Funciona tanto en start:dev como en start:prod
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Backend en http://localhost:3000/api');
  console.log('🖼️  Uploads en http://localhost:3000/uploads/...');
  console.log(`📁 Sirviendo desde: ${join(process.cwd(), 'uploads')}`);
}
bootstrap();