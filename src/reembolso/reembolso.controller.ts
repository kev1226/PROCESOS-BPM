import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateReembolsoDto } from './dto/create-reembolso.dto';
import { ReembolsoService } from './reembolso.service';
import { CamundaService } from '../auth/camunda.service';
import { extname } from 'path';

@Controller('reembolso')
export class ReembolsoController {
  constructor(
    private readonly reembolsoService: ReembolsoService,
    private readonly camundaService: CamundaService,
  ) {}

  @Post('solicitar')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: './uploads/facturas',
        filename: (req, file, cb) => {
          const nombre = `${Date.now()}_${file.originalname}`;
          cb(null, nombre);
        },
      }),
    }),
  )
  async solicitar(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() dto: CreateReembolsoDto,
  ) {
    dto.fecha_envio_solicitud = new Date().toISOString();
    dto.monto = parseFloat(dto.monto as unknown as string);

    // 🔍 Verificar si ya existe
    const existe = await this.reembolsoService.buscarPorNumeroFactura(
      dto.numero_factura,
    );

    let duplicidad: 'sí' | 'no' = 'no';

    if (!existe) {
      // ✅ Si no existe, guardar
      await this.reembolsoService.registrar(dto, archivo);
    } else {
      // ⚠️ Si existe, marcar duplicidad
      duplicidad = 'sí';
    }

    // ✅ Siempre se inicia el proceso
    const variablesCamunda = {
      pais: dto.pais,
      numero_factura: dto.numero_factura,
      fecha_factura: dto.fecha_factura,
      monto: dto.monto,
      ruc: dto.ruc || null,
      cedula: dto.cedula,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      correo: dto.correo,
      area: dto.area,
      banco: dto.banco,
      cuenta_bancaria: dto.cuenta_bancaria,
      archivo_ruta: `uploads/facturas/${archivo.filename}`,
      fecha_envio_solicitud: dto.fecha_envio_solicitud,
      duplicidad: duplicidad, // 👈 aquí se pasa la variable
    };

    const instancia =
      await this.camundaService.iniciarProcesoReembolso(variablesCamunda);

    return {
      message: '📤 Proceso iniciado.',
      duplicada: duplicidad === 'sí',
      instancia,
    };
  }
}
