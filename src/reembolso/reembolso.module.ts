import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReembolsoController } from './reembolso.controller';
import { ReembolsoService } from './reembolso.service';
import { ReembolsoFactura } from './entities/reembolso-factura.entity';
import { CamundaService } from '../auth/camunda.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReembolsoFactura])],
  controllers: [ReembolsoController],
  providers: [ReembolsoService, CamundaService],
})
export class ReembolsoModule {}
