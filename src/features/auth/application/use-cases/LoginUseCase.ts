import { User, LoginDTO } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: LoginDTO): Promise<User> {
    if (!dto.email || !dto.password) {
      throw new Error("Email y contraseña son requeridos");
    }
    return this.authRepo.login(dto);
  }
}