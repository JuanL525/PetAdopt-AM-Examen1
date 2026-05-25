import { Client, Account, ID } from 'react-native-appwrite';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { User, CreateUserDTO, LoginDTO, isUserRole } from '../../domain/entities/User';
import { AppError } from '@shared/domain/errors/AppError';

export class AppwriteAuthRepository implements IAuthRepository {
  private client: Client;
  private account: Account;

  constructor() {
    this.client = new Client()
      .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
      .setPlatform('host.exp.exponent');
    
    this.account = new Account(this.client);
  }

  async login(dto: LoginDTO): Promise<User> {
    try {
      // 1. Crear sesión de correo y contraseña
      await this.account.createEmailPasswordSession(dto.email, dto.password);
      
      // 2. Obtener los detalles del usuario
      const user = await this.account.get();
      return this.mapUser(user);
    } catch (error: any) {
      throw new AppError('AUTH_LOGIN_FAILED', error.message || 'Error en inicio de sesión con Appwrite');
    }
  }

  async register(dto: CreateUserDTO): Promise<User> {
    try {
      // 1. Crear la cuenta de usuario en Appwrite Auth
      const userId = ID.unique();
      await this.account.create(userId, dto.email, dto.password, dto.username);

      // 2. Iniciar sesión automáticamente para poder actualizar las preferencias
      await this.account.createEmailPasswordSession(dto.email, dto.password);

      // 3. Guardar el rol y nombre de usuario dentro de los "Prefs" del usuario en Appwrite Auth
      await this.account.updatePrefs({
        role: dto.role,
        username: dto.username,
        avatarUrl: null
      });

      // 4. Obtener usuario actualizado con sus preferencias
      const user = await this.account.get();
      return this.mapUser(user);
    } catch (error: any) {
      throw new AppError('AUTH_REGISTER_FAILED', error.message || 'Error al registrar usuario en Appwrite');
    }
  }

  async logout(): Promise<void> {
    try {
      // Eliminar la sesión activa actual
      await this.account.deleteSession('current');
    } catch (error: any) {
      throw new AppError('AUTH_LOGOUT_FAILED', error.message || 'Error al cerrar sesión en Appwrite');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // Intentar obtener la sesión activa. Si no hay sesión, fallará de forma segura y retornamos null
      const user = await this.account.get();
      return this.mapUser(user);
    } catch {
      return null;
    }
  }

  private mapUser(user: any): User {
    const prefs = user.prefs || {};
    const role = isUserRole(prefs.role) ? prefs.role : 'client';

    return {
      id: user.$id,
      username: user.name || prefs.username || 'Usuario',
      role,
      avatarUrl: prefs.avatarUrl || null,
      createdAt: user.$createdAt,
      email: user.email,
    };
  }
}
