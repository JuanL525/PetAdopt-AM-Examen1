import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class ForgotPasswordUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  execute(email: string): Promise<void> {
    return this.repo.forgotPassword(email);
  }
}
