import { supabase, HybridStorageAdapter } from '@shared/infrastructure/supabase/client';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { User, CreateUserDTO, LoginDTO, isUserRole } from '../../domain/entities/User';
import { AppError } from '@shared/domain/errors/AppError';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

// Referencia del proyecto Supabase, extraída de la URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];

// El cliente de Supabase por defecto usa 'sb-auth-token' como storageKey
// y le añade '-code-verifier' para almacenar el PKCE code_verifier.
const CODE_VERIFIER_KEY = 'sb-auth-token-code-verifier';
const FALLBACK_CODE_VERIFIER_KEY = `sb-${PROJECT_REF}-auth-token-code-verifier`;

export class SupabaseAuthRepository implements IAuthRepository {
  async login(dto: LoginDTO): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });
    if (error) throw new AppError('AUTH_LOGIN_FAILED', error.message);
    if (!data.user) throw new AppError('AUTH_NO_USER', 'Usuario no encontrado');

    return this.fetchProfile(data.user.id, data.user.email ?? '', data.user);
  }

  async register(dto: CreateUserDTO): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          username: dto.username,
          role: dto.role,
        },
      },
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

    if (profileError) {
      console.warn('Advertencia al insertar perfil en la base de datos (puede que ya exista por un trigger o por políticas de RLS):', profileError.message);
    }

    // Retornamos el objeto User directamente con los datos locales para evitar
    // errores de RLS (Row Level Security) al intentar leer el perfil antes de
    // que la sesión del cliente esté completamente iniciada y autorizada.
    return {
      id: data.user.id,
      username: dto.username,
      role: dto.role,
      avatarUrl: null,
      createdAt: data.user.created_at ?? new Date().toISOString(),
      email: dto.email,
    };
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new AppError('AUTH_LOGOUT_FAILED', error.message);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('[Auth] getUser error, using session fallback:', error.message);
        return this.fetchProfile(session.user.id, session.user.email ?? '', session.user);
      }
      if (!user) return null;
      return this.fetchProfile(user.id, user.email ?? '', user);
    } catch (e) {
      console.error('[Auth] Exception in getCurrentUser:', e);
      return null;
    }
  }

  private async fetchProfile(userId: string, email: string, authUser?: any): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role, avatar_url, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        if (authUser) {
          const metadata = authUser.user_metadata || {};
          const role = isUserRole(metadata.role) ? metadata.role : 'adoptante';
          return {
            id: userId,
            username: metadata.username || email.split('@')[0] || 'Usuario',
            role,
            avatarUrl: metadata.avatarUrl || null,
            createdAt: authUser.created_at ?? new Date().toISOString(),
            email,
          };
        }
        throw new AppError('PROFILE_FETCH_FAILED', error.message);
      }

      const role = isUserRole(data.role) ? data.role : 'adoptante';

      return {
        id: data.id,
        username: data.username,
        role,
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
        email,
      };
    } catch (e: any) {
      if (authUser) {
        const metadata = authUser.user_metadata || {};
        const role = isUserRole(metadata.role) ? metadata.role : 'adoptante';
        return {
          id: userId,
          username: metadata.username || email.split('@')[0] || 'Usuario',
          role,
          avatarUrl: metadata.avatarUrl || null,
          createdAt: authUser?.created_at ?? new Date().toISOString(),
          email,
        };
      }
      throw new AppError('PROFILE_FETCH_FAILED', e.message || 'Error al obtener perfil');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.EXPO_PUBLIC_WEB_AUTH_URL ?? 'https://petadopt-auth.vercel.app',
    });
    if (error) throw new AppError('AUTH_RESET_FAILED', error.message);
  }

  async loginWithGoogle(): Promise<User> {
    const redirectUrl = Linking.createURL('/');
    console.log('[Google Login] Generated redirectUrl:', redirectUrl);

    // 1. Obtener la URL de autenticación de Supabase (con PKCE)
    console.log('[Google Login] Calling signInWithOAuth...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });

    if (error) {
      console.error('[Google Login] signInWithOAuth Error:', error);
      throw new AppError('AUTH_GOOGLE_FAILED', error.message);
    }

    if (!data?.url) {
      throw new AppError('AUTH_GOOGLE_FAILED', 'No se pudo generar la URL de autenticación');
    }

    console.log('[Google Login] OAuth URL generated:', data.url);

    // 2. Abrir el navegador del sistema
    console.log('[Google Login] Opening system browser...');
    await Linking.openURL(data.url);

    // 3. Fire-and-forget: resolver inmediatamente
    console.log('[Google Login] Fire-and-forget triggered browser redirect.');
    return {} as any;
  }
}
