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
      ZEEBE_ADDRESS: this.config.getOrThrow('ZEEBE_ADDRESS'),
      ZEEBE_CLIENT_ID: this.config.getOrThrow('ZEEBE_CLIENT_ID'),
      ZEEBE_CLIENT_SECRET: this.config.getOrThrow('ZEEBE_CLIENT_SECRET'),
      CAMUNDA_OAUTH_URL: this.config.getOrThrow('CAMUNDA_OAUTH_URL'),
    });
  }

  async iniciarProcesoReembolso(variables: Record<string, any>) {
    try {
      const zeebe = this.camunda.getZeebeGrpcApiClient();

      this.logger.log(
        '⏳ Publicando mensaje "portal" para iniciar instancia...',
      );

      const result = await zeebe.publishMessage({
        name: 'portal', // 🔑 debe coincidir con el Global message reference
        correlationKey: 'clave-' + Date.now(), // 🔑 debe ser única por mensaje
        timeToLive: 10000,
        variables,
      });

      this.logger.log(
        `✅ Mensaje publicado para iniciar proceso con cédula ${variables.cedula}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        '❌ Error al iniciar proceso en Camunda',
        error?.message || error,
      );
      throw new Error('No se pudo iniciar el proceso en Camunda.');
    }
  }
}
