import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');
  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Backend en http://localhost:3000/api');
}
bootstrap();