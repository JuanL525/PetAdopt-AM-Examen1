import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { User, CreateUserDTO } from '../../domain/entities/User';

export class RegisterUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: CreateUserDTO): Promise<User> {
    if (!dto.email || !dto.password || !dto.username) {
      throw new Error('Todos los campos son obligatorios');
    }
    if (dto.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    return this.authRepository.register(dto);
  }
}