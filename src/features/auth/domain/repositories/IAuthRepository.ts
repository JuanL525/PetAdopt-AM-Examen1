import { User, CreateUserDTO, LoginDTO } from '../entities/User';

export interface IAuthRepository {
  login(dto: LoginDTO): Promise<User>;
  register(dto: CreateUserDTO): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  loginWithGoogle(): Promise<User>;
  forgotPassword(email: string): Promise<void>;
}