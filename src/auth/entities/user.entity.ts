import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('empleados')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  cedula: string;

  @Column()
  nombres: string;

  @Column()
  apellidos: string;

  @Column()
  correo: string;

  @Column()
  password: string;

  @Column()
  area: string;

  @Column()
  banco: string;

  @Column()
  cuenta_bancaria: string;
}
