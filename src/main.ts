import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser'; // ✅ Import necesario
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'], // ✅ Logs detallados
  });

  // ✅ Aumenta el límite de tamaño del JSON a 10MB
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // ✅ CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'], // (no METHODS en mayúsculas)
  });

  app.use('/app', express.static(join(__dirname, '..', 'public')));

  await app.listen(process.env.PORT ?? 3003);
}
bootstrap();
