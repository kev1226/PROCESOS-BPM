import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CamundaService } from './camunda.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly camundaService: CamundaService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<Partial<User>> {
    try {
      const user = await this.userRepo.findOne({
        where: { correo: loginDto.correo },
      });

      if (!user) throw new UnauthorizedException('Usuario no registrado.');
      if (user.password !== loginDto.password)
        throw new UnauthorizedException('Contraseña incorrecta.');

      const {
        cedula,
        nombres,
        apellidos,
        correo,
        area,
        banco,
        cuenta_bancaria,
      } = user;

      // Iniciar proceso en Camunda con los datos del usuario
      await this.camundaService.iniciarProcesoReembolso({
        cedula,
        nombres,
        apellidos,
        correo,
        area,
        banco,
        cuenta_bancaria,
      });

      this.logger.log(`✅ Usuario autenticado: ${correo}`);

      return {
        cedula,
        nombres,
        apellidos,
        correo,
        area,
        banco,
        cuenta_bancaria,
      };
    } catch (error) {
      this.logger.error(`❌ Error al validar el usuario: ${error.message}`);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Error al validar el usuario.');
    }
  }
}
