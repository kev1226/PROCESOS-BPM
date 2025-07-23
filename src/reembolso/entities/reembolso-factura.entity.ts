import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('facturas_reembolso')
export class ReembolsoFactura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cedula: string;

  @Column()
  numero_factura: string;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fecha_factura: string;

  @Column({ type: 'datetime' })
  fecha_envio_solicitud: Date;

  @Column({ nullable: true, type: 'varchar' })
  ruc: string | null;

  @Column()
  pais: string;

  @Column()
  archivo_nombre: string;

  @Column()
  archivo_tipo: string;

  @Column()
  archivo_tamanio: number;

  // 🆕 Campo adicional
  @Column()
  archivo_ruta: string;
}
