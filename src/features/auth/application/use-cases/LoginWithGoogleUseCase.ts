import { User } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class LoginWithGoogleUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(): Promise<User> {
    return this.authRepo.loginWithGoogle();
  }
}
