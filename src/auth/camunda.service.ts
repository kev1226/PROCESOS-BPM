import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Camunda8 } from '@camunda8/sdk';

@Injectable()
export class CamundaService {
  private readonly logger = new Logger(CamundaService.name);
  private readonly camunda: Camunda8;

  constructor(private readonly config: ConfigService) {
    this.camunda = new Camunda8({
      CAMUNDA_AUTH_STRATEGY: 'OAUTH',
      ZEEBE_ADDRESS: this.config.getOrThrow('ZEEBE_ADDRESS'), // con :443
      ZEEBE_CLIENT_ID: this.config.getOrThrow('ZEEBE_CLIENT_ID'),
      ZEEBE_CLIENT_SECRET: this.config.getOrThrow('ZEEBE_CLIENT_SECRET'),
      CAMUNDA_OAUTH_URL: this.config.getOrThrow('CAMUNDA_OAUTH_URL'),
    });
  }

  async iniciarProcesoReembolso(variables: Record<string, any>) {
    try {
      const zeebe = this.camunda.getZeebeGrpcApiClient(); // ✅ Cliente gRPC

      await zeebe.publishMessage({
        name: 'portal', // ← este es el campo correcto para gRPC
        correlationKey: 'inicio-externo', // requerido aunque no se use para correlación real
        timeToLive: 10000,
        variables,
      });

      this.logger.log(
        `✅ Mensaje publicado correctamente para iniciar proceso con cédula ${variables.cedula}`,
      );
    } catch (error) {
      this.logger.error('❌ Error al iniciar proceso en Camunda', error);
      throw new Error('No se pudo iniciar el proceso en Camunda.');
    }
  }
}
