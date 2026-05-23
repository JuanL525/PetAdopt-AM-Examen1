import { supabase } from '@shared/infrastructure/supabase/client';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { User, CreateUserDTO, LoginDTO, isUserRole } from '../../domain/entities/User';
import { AppError } from '@shared/domain/errors/AppError';

export class SupabaseAuthRepository implements IAuthRepository {
  async login(dto: LoginDTO): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });
    if (error) throw new AppError('AUTH_LOGIN_FAILED', error.message);
    if (!data.user) throw new AppError('AUTH_NO_USER', 'Usuario no encontrado');

    return this.fetchProfile(data.user.id, data.user.email ?? '');
  }

  async register(dto: CreateUserDTO): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });
    if (error) throw new AppError('AUTH_REGISTER_FAILED', error.message);
    if (!data.user) throw new AppError('AUTH_NO_USER', 'Error al crear usuario');

    // Crear perfil con rol — esto es lo nuevo
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: dto.username,
        role: dto.role,           // <-- campo nuevo
      });

    if (profileError) throw new AppError('PROFILE_CREATE_FAILED', profileError.message);

    return this.fetchProfile(data.user.id, dto.email);
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new AppError('AUTH_LOGOUT_FAILED', error.message);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return this.fetchProfile(user.id, user.email ?? '');
  }

  private async fetchProfile(userId: string, email: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) throw new AppError('PROFILE_FETCH_FAILED', error.message);

    const role = isUserRole(data.role) ? data.role : 'client';

    return {
      id: data.id,
      username: data.username,
      role,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      email,
    };
  }
}
