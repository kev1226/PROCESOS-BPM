import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ReembolsoModule } from './reembolso/reembolso.module';
import { OcrModule } from './ocr/ocr.module';
import { OcrService } from './ocr/ocr.service';
import { iniciarOCRWorker } from './ocr/ocr.worker';
import { User } from './auth/entities/user.entity';
import { iniciarWorkerVerificarPresupuesto } from './finanzas/registroContable.service';
import { iniciarWorkerProcesarPago } from './finanzas/ordenPago.service';
import { iniciarWorkerLoginInterno } from './auth/workers/login.worker';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: 3307,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User],
      synchronize: true,
      autoLoadEntities: true,
    }),
    AuthModule,
    ReembolsoModule,
    OcrModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly ocrService: OcrService) {}

  async onModuleInit() {
    // 🔁 Levantar OCR
    await iniciarOCRWorker(this.ocrService);

    // 🔁 Levantar workers de Finanzas
    await iniciarWorkerVerificarPresupuesto();

    // 🔁 Levantar worker de Procesar Pago
    await iniciarWorkerProcesarPago();

    // 🔁 Levantar worker de Login
    await iniciarWorkerLoginInterno();
  }
}
