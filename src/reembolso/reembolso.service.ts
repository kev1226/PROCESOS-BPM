import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReembolsoFactura } from './entities/reembolso-factura.entity';
import { CreateReembolsoDto } from './dto/create-reembolso.dto';

@Injectable()
export class ReembolsoService {
  constructor(
    @InjectRepository(ReembolsoFactura)
    private readonly reembolsoRepo: Repository<ReembolsoFactura>,
  ) {}

  async registrar(dto: CreateReembolsoDto, archivo: Express.Multer.File) {
    const registro = this.reembolsoRepo.create({
      cedula: dto.cedula,
      numero_factura: dto.numero_factura,
      monto: dto.monto,
      fecha_factura: dto.fecha_factura,
      fecha_envio_solicitud: new Date(),

      ruc: dto.ruc || null,
      pais: dto.pais,

      archivo_nombre: archivo.originalname,
      archivo_tipo: archivo.mimetype,
      archivo_tamanio: archivo.size,
      archivo_ruta: `uploads/facturas/${archivo.filename}`,
    });

    return this.reembolsoRepo.save(registro);
  }

  async buscarPorNumeroFactura(numero_factura: string) {
    return this.reembolsoRepo.findOne({
      where: { numero_factura },
    });
  }
}
