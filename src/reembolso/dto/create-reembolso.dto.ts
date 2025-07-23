import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  Matches,
  IsIn,
  IsNumber,
  Min,
} from 'class-validator';

// 🧾 DTO principal del reembolso (sin archivo)
export class CreateReembolsoDto {
  @IsNotEmpty()
  @IsIn(['EC', 'US', 'ES', 'AR', 'CO', 'OTRO'])
  pais: string;

  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9\-]{3,30}$/, {
    message: 'Número de factura inválido',
  })
  numero_factura: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'Fecha inválida' })
  fecha_factura: string;

  @IsNotEmpty()
  @Type(() => Number) // 👈 convierte string a number automáticamente
  @IsNumber({}, { message: 'Monto debe ser un número válido' })
  @Min(0.01, { message: 'Monto debe ser mayor a 0' })
  monto: number;

  @IsOptional()
  @Matches(/^[0-9A-Za-z\-]{5,20}$/, {
    message: 'RUC o VAT inválido',
  })
  ruc?: string;

  @IsNotEmpty()
  cedula: string;

  @IsNotEmpty()
  nombres: string;

  @IsNotEmpty()
  apellidos: string;

  @IsNotEmpty()
  correo: string;

  @IsNotEmpty()
  area: string;

  @IsNotEmpty()
  banco: string;

  @IsNotEmpty()
  cuenta_bancaria: string;

  @IsOptional()
  @IsDateString()
  fecha_envio_solicitud?: string;
}
