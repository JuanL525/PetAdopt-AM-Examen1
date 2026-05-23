# Feature: Roles + Chat en Tiempo Real — Implementación Clean Architecture

## Contexto del proyecto

Aplicación Expo Router + TypeScript. Ya existe: login con Supabase, estructura de carpetas Clean Architecture por features (`src/features/auth`, `src/features/chat`), tablas `profiles`, `rooms`, `messages` en Supabase con RLS activado.

**Lo que falta implementar:** soporte de roles (`seller` / `client`), guards de navegación por rol, dashboard del vendedor, y chat en tiempo real con Supabase Realtime.

---

## Paso 0 — SQL en Supabase (ejecutar primero)

```sql
-- Añadir rol al perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client'
  CHECK (role IN ('seller', 'client'));

-- Tabla de miembros de sala
CREATE TABLE IF NOT EXISTS public.room_members (
  room_id    UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Solo miembros de la sala pueden leer sus mensajes
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = messages.room_id AND rm.user_id = auth.uid()
    )
  );

-- Solo vendedores pueden crear salas
DROP POLICY IF EXISTS "rooms_insert" ON public.rooms;
CREATE POLICY "rooms_insert" ON public.rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'seller'
    )
  );

-- Cualquier autenticado puede unirse a una sala
CREATE POLICY "room_members_insert" ON public.room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "room_members_select" ON public.room_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Habilitar Realtime en room_members también
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;

-- Función helper para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## Paso 1 — Domain layer

### `src/features/auth/domain/entities/User.ts`

Reemplazar el archivo completo:

```typescript
export type UserRole = 'seller' | 'client';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  email: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  username: string;
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export function isUserRole(value: unknown): value is UserRole {
  return value === 'seller' || value === 'client';
}

export function canCreateRoom(user: User): boolean {
  return user.role === 'seller';
}

export function getUserInitials(user: Pick<User, 'username'>): string {
  return user.username
    .split(' ')
    .map((word) => word[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}
```

### `src/features/auth/domain/repositories/IAuthRepository.ts`

```typescript
import { User, CreateUserDTO, LoginDTO } from '../entities/User';

export interface IAuthRepository {
  login(dto: LoginDTO): Promise<User>;
  register(dto: CreateUserDTO): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
```

### `src/features/chat/domain/entities/Room.ts`

Crear archivo nuevo:

```typescript
export interface Room {
  id: string;
  name: string;
  createdBy: string;       // user id del seller que la creó
  createdAt: string;
  memberCount?: number;    // opcional, para mostrar en el dashboard
}

export interface CreateRoomDTO {
  name: string;
}
```

### `src/features/chat/domain/repositories/IChatRepository.ts`

Reemplazar el archivo completo:

```typescript
import { Message } from '../entities/Message';
import { Room, CreateRoomDTO } from '../entities/Room';

export interface IChatRepository {
  // Mensajes
  getMessages(roomId: string): Promise<Message[]>;
  sendMessage(roomId: string, content: string): Promise<Message>;

  /**
   * Suscripción en tiempo real.
   * Retorna una función de CLEANUP — esto es lo que hace posible
   * la migración a AppWrite en el video 2: solo cambia esta implementación.
   */
  subscribeToRoom(
    roomId: string,
    onMessage: (message: Message) => void
  ): () => void;

  // Salas
  getRooms(): Promise<Room[]>;
  createRoom(dto: CreateRoomDTO): Promise<Room>;
  joinRoom(roomId: string): Promise<void>;
}
```

---

## Paso 2 — Infrastructure layer

### `src/features/auth/infrastructure/repositories/SupabaseAuthRepository.ts`

```typescript
import { supabase } from '@/src/shared/infrastructure/supabase/client';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { User, CreateUserDTO, LoginDTO, isUserRole } from '../../domain/entities/User';
import { AppError } from '@/src/shared/domain/errors/AppError';

export class SupabaseAuthRepository implements IAuthRepository {
  async login(dto: LoginDTO): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });
    if (error) throw new AppError(error.message, 'AUTH_LOGIN_FAILED');
    if (!data.user) throw new AppError('Usuario no encontrado', 'AUTH_NO_USER');

    return this.fetchProfile(data.user.id, data.user.email ?? '');
  }

  async register(dto: CreateUserDTO): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });
    if (error) throw new AppError(error.message, 'AUTH_REGISTER_FAILED');
    if (!data.user) throw new AppError('Error al crear usuario', 'AUTH_NO_USER');

    // Crear perfil con rol — esto es lo nuevo
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: dto.username,
        role: dto.role,           // <-- campo nuevo
      });

    if (profileError) throw new AppError(profileError.message, 'PROFILE_CREATE_FAILED');

    return this.fetchProfile(data.user.id, dto.email);
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new AppError(error.message, 'AUTH_LOGOUT_FAILED');
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

    if (error) throw new AppError(error.message, 'PROFILE_FETCH_FAILED');

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
```

### `src/features/chat/infrastructure/repositories/SupabaseChatRepository.ts`

```typescript
import { supabase } from '@/src/shared/infrastructure/supabase/client';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Message } from '../../domain/entities/Message';
import { Room, CreateRoomDTO } from '../../domain/entities/Room';
import { AppError } from '@/src/shared/domain/errors/AppError';

export class SupabaseChatRepository implements IChatRepository {

  async getMessages(roomId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, room_id,
        profiles:user_id ( id, username, avatar_url, role )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw new AppError(error.message, 'MESSAGES_FETCH_FAILED');
    return (data ?? []).map(this.mapMessage);
  }

  async sendMessage(roomId: string, content: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AppError('No autenticado', 'AUTH_REQUIRED');

    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, user_id: user.id, content })
      .select(`
        id, content, created_at, room_id,
        profiles:user_id ( id, username, avatar_url, role )
      `)
      .single();

    if (error) throw new AppError(error.message, 'MESSAGE_SEND_FAILED');
    return this.mapMessage(data);
  }

  subscribeToRoom(roomId: string, onMessage: (message: Message) => void): () => void {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Hacemos fetch del mensaje completo para tener el perfil del autor
          const { data } = await supabase
            .from('messages')
            .select(`
              id, content, created_at, room_id,
              profiles:user_id ( id, username, avatar_url, role )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) onMessage(this.mapMessage(data));
        }
      )
      .subscribe();

    // Función de cleanup — clave para la migración a AppWrite
    return () => {
      supabase.removeChannel(channel);
    };
  }

  async getRooms(): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, name, created_by, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 'ROOMS_FETCH_FAILED');
    return (data ?? []).map(this.mapRoom);
  }

  async createRoom(dto: CreateRoomDTO): Promise<Room> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AppError('No autenticado', 'AUTH_REQUIRED');

    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: dto.name, created_by: user.id })
      .select()
      .single();

    if (error) throw new AppError(error.message, 'ROOM_CREATE_FAILED');

    // Unir automáticamente al creador
    await this.joinRoom(data.id);
    return this.mapRoom(data);
  }

  async joinRoom(roomId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AppError('No autenticado', 'AUTH_REQUIRED');

    const { error } = await supabase
      .from('room_members')
      .upsert({ room_id: roomId, user_id: user.id });

    if (error) throw new AppError(error.message, 'ROOM_JOIN_FAILED');
  }

  private mapMessage(data: any): Message {
    const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
    return {
      id: data.id,
      roomId: data.room_id,
      content: data.content,
      createdAt: data.created_at,
      author: {
        id: profile?.id ?? '',
        username: profile?.username ?? 'Desconocido',
        avatarUrl: profile?.avatar_url ?? null,
        role: profile?.role ?? 'client',
      },
    };
  }

  private mapRoom(data: any): Room {
    return {
      id: data.id,
      name: data.name,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }
}
```

### `src/features/chat/domain/entities/Message.ts`

Asegurarse de que el tipo `Message` incluya `author` con `role`:

```typescript
export interface MessageAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: 'seller' | 'client';
}

export interface Message {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
  author: MessageAuthor;
}
```

---

## Paso 3 — Application layer (use cases)

### `src/features/auth/application/use-cases/RegisterUseCase.ts`

```typescript
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
```

### `src/features/chat/application/use-cases/CreateRoomUseCase.ts`

```typescript
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Room, CreateRoomDTO } from '../../domain/entities/Room';
import { User, canCreateRoom } from '@/src/features/auth/domain/entities/User';
import { AppError } from '@/src/shared/domain/errors/AppError';

export class CreateRoomUseCase {
  constructor(private readonly chatRepository: IChatRepository) {}

  async execute(dto: CreateRoomDTO, currentUser: User): Promise<Room> {
    // Regla de negocio: solo sellers pueden crear salas
    if (!canCreateRoom(currentUser)) {
      throw new AppError('Solo los vendedores pueden crear salas', 'FORBIDDEN');
    }
    if (!dto.name.trim()) {
      throw new AppError('El nombre de la sala es obligatorio', 'VALIDATION_ERROR');
    }
    return this.chatRepository.createRoom(dto);
  }
}
```

---

## Paso 4 — Dependency Injection

### `src/di/container.ts` (archivo nuevo)

```typescript
/**
 * Contenedor de inyección de dependencias.
 *
 * ESTE ES EL ÚNICO ARCHIVO QUE CAMBIA EN LA MIGRACIÓN A APPWRITE.
 * Para migrar: cambiar los imports de Supabase* por Appwrite*.
 * Todos los use cases y la UI permanecen idénticos.
 */
import { SupabaseAuthRepository } from '@/src/features/auth/infrastructure/repositories/SupabaseAuthRepository';
import { SupabaseChatRepository } from '@/src/features/chat/infrastructure/repositories/SupabaseChatRepository';

import { LoginUseCase }           from '@/src/features/auth/application/use-cases/LoginUseCase';
import { RegisterUseCase }        from '@/src/features/auth/application/use-cases/RegisterUseCase';
import { GetMessagesUseCase }     from '@/src/features/chat/application/use-cases/GetMessagesUseCase';
import { SendMessageUseCase }     from '@/src/features/chat/application/use-cases/SendMessageUseCase';
import { SubscribeToRoomUseCase } from '@/src/features/chat/application/use-cases/SubscribeToRoomUseCase';
import { CreateRoomUseCase }      from '@/src/features/chat/application/use-cases/CreateRoomUseCase';

// ── Repositorios (intercambiables) ───────────────────────────────────────────
const authRepository = new SupabaseAuthRepository();
const chatRepository = new SupabaseChatRepository();

// ── Use cases (no cambian al migrar) ─────────────────────────────────────────
export const loginUseCase           = new LoginUseCase(authRepository);
export const registerUseCase        = new RegisterUseCase(authRepository);
export const getMessagesUseCase     = new GetMessagesUseCase(chatRepository);
export const sendMessageUseCase     = new SendMessageUseCase(chatRepository);
export const subscribeToRoomUseCase = new SubscribeToRoomUseCase(chatRepository);
export const createRoomUseCase      = new CreateRoomUseCase(chatRepository);
```

---

## Paso 5 — Presentation layer

### `src/features/auth/presentation/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { User } from '../../domain/entities/User';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser:    (user)    => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError:   (error)   => set({ error }),
  reset: () => set({ user: null, isLoading: false, error: null }),
}));
```

### `src/features/auth/presentation/hooks/useAuth.ts`

```typescript
import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { loginUseCase, registerUseCase } from '@/src/di/container';
import { CreateUserDTO, LoginDTO } from '../../domain/entities/User';

export function useAuth() {
  const { user, isLoading, error, setUser, setLoading, setError, reset } = useAuthStore();

  const login = useCallback(async (dto: LoginDTO) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await loginUseCase.execute(dto);
      setUser(loggedUser);
      return loggedUser;
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (dto: CreateUserDTO) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await registerUseCase.execute(dto);
      setUser(newUser);
      return newUser;
    } catch (e: any) {
      setError(e.message ?? 'Error al registrarse');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, isLoading, error, login, register, logout: reset };
}
```

### `components/RoleGuard.tsx` (archivo nuevo)

```typescript
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/presentation/store/authStore';
import { UserRole } from '@/src/features/auth/domain/entities/User';

interface RoleGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

/**
 * Redirige al usuario si su rol no coincide con el permitido.
 * Uso en layouts: <RoleGuard allowedRole="seller"><Slot /></RoleGuard>
 */
export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    if (user.role !== allowedRole) {
      // Redirigir a su pantalla correcta
      router.replace(user.role === 'seller' ? '/(app)/seller' : '/(app)/client');
    }
  }, [user, allowedRole]);

  if (!user || user.role !== allowedRole) return null;
  return <>{children}</>;
}
```

### `app/(app)/index.tsx`

```typescript
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/presentation/store/authStore';
import { View, ActivityIndicator } from 'react-native';

/**
 * Puerta de entrada tras el login.
 * Lee el rol y redirige a la pantalla correcta.
 */
export default function AppIndex() {
  const user  = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    if (user.role === 'seller') {
      router.replace('/(app)/seller');
    } else {
      router.replace('/(app)/client');
    }
  }, [user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
```

---

## Paso 6 — Nuevas rutas (crear archivos)

### `app/(app)/seller/_layout.tsx`

```typescript
import { Slot } from 'expo-router';
import { RoleGuard } from '@/components/RoleGuard';

export default function SellerLayout() {
  return (
    <RoleGuard allowedRole="seller">
      <Slot />
    </RoleGuard>
  );
}
```

### `app/(app)/seller/index.tsx` — Dashboard del vendedor

```typescript
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/presentation/store/authStore';
import { createRoomUseCase, getMessagesUseCase } from '@/src/di/container';
import { useRooms } from '@/src/features/chat/presentation/hooks/useRooms';
import { Room } from '@/src/features/chat/domain/entities/Room';
import { getUserInitials } from '@/src/features/auth/domain/entities/User';

export default function SellerDashboard() {
  const user   = useAuthStore((s) => s.user);
  const router = useRouter();
  const { rooms, isLoading, loadRooms } = useRooms();
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadRooms(); }, []);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !user) return;
    setCreating(true);
    try {
      await createRoomUseCase.execute({ name: newRoomName.trim() }, user);
      setNewRoomName('');
      loadRooms();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCreating(false);
    }
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push(`/(app)/chat/${item.id}`)}
    >
      <View style={styles.roomIcon}>
        <Text style={styles.roomIconText}>#</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomMeta}>
          {new Date(item.createdAt).toLocaleDateString('es-EC', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>🏷 Vendedor</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? getUserInitials(user) : '?'}
          </Text>
        </View>
      </View>

      {/* Crear sala */}
      <View style={styles.createSection}>
        <Text style={styles.sectionTitle}>Nueva sala de soporte</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del producto o sala..."
            placeholderTextColor="#9ca3af"
            value={newRoomName}
            onChangeText={setNewRoomName}
          />
          <TouchableOpacity
            style={[styles.createBtn, (!newRoomName.trim() || creating) && styles.createBtnDisabled]}
            onPress={handleCreateRoom}
            disabled={!newRoomName.trim() || creating}
          >
            {creating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.createBtnText}>+</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de salas */}
      <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>
        Tus salas ({rooms.length})
      </Text>
      {isLoading
        ? <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" />
        : <FlatList
            data={rooms}
            keyExtractor={(r) => r.id}
            renderItem={renderRoom}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aún no tienes salas. ¡Crea una!</Text>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0f0f14' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24,
                     backgroundColor: '#18181f', borderBottomWidth: 1, borderBottomColor: '#2d2d3a' },
  greeting:        { color: '#f8f8ff', fontSize: 20, fontWeight: '600' },
  roleBadge:       { marginTop: 4, backgroundColor: '#312e81', borderRadius: 6,
                     paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  roleText:        { color: '#a5b4fc', fontSize: 12, fontWeight: '500' },
  avatar:          { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1',
                     justifyContent: 'center', alignItems: 'center' },
  avatarText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  createSection:   { margin: 20, backgroundColor: '#18181f', borderRadius: 16,
                     padding: 20, borderWidth: 1, borderColor: '#2d2d3a' },
  sectionTitle:    { color: '#9ca3af', fontSize: 13, fontWeight: '600',
                     textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  inputRow:        { flexDirection: 'row', gap: 10 },
  input:           { flex: 1, backgroundColor: '#0f0f14', borderRadius: 12, paddingHorizontal: 16,
                     paddingVertical: 12, color: '#f8f8ff', fontSize: 15,
                     borderWidth: 1, borderColor: '#2d2d3a' },
  createBtn:       { width: 48, height: 48, borderRadius: 12, backgroundColor: '#6366f1',
                     justifyContent: 'center', alignItems: 'center' },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText:   { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  roomCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181f',
                     borderRadius: 14, padding: 16, marginBottom: 10,
                     borderWidth: 1, borderColor: '#2d2d3a' },
  roomIcon:        { width: 40, height: 40, borderRadius: 10, backgroundColor: '#312e81',
                     justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  roomIconText:    { color: '#a5b4fc', fontSize: 20, fontWeight: '700' },
  roomName:        { color: '#f8f8ff', fontSize: 16, fontWeight: '600' },
  roomMeta:        { color: '#6b7280', fontSize: 12, marginTop: 2 },
  chevron:         { color: '#6b7280', fontSize: 22 },
  emptyText:       { color: '#6b7280', textAlign: 'center', marginTop: 40, fontSize: 15 },
});
```

### `app/(app)/client/_layout.tsx`

```typescript
import { Slot } from 'expo-router';
import { RoleGuard } from '@/components/RoleGuard';

export default function ClientLayout() {
  return (
    <RoleGuard allowedRole="client">
      <Slot />
    </RoleGuard>
  );
}
```

### `app/(app)/client/index.tsx` — Pantalla del cliente: lista de salas disponibles

```typescript
import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/presentation/store/authStore';
import { useRooms } from '@/src/features/chat/presentation/hooks/useRooms';
import { Room } from '@/src/features/chat/domain/entities/Room';
import { getUserInitials } from '@/src/features/auth/domain/entities/User';

export default function ClientHome() {
  const user   = useAuthStore((s) => s.user);
  const router = useRouter();
  const { rooms, isLoading, loadRooms } = useRooms();

  useEffect(() => { loadRooms(); }, []);

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push(`/(app)/chat/${item.id}`)}
    >
      <View style={styles.roomIcon}>
        <Text style={styles.roomIconText}>#</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomMeta}>Toca para preguntar sobre este producto</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>👤 Cliente</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? getUserInitials(user) : '?'}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>¿Sobre qué producto quieres preguntar?</Text>

      {isLoading
        ? <ActivityIndicator style={{ marginTop: 40 }} color="#10b981" />
        : <FlatList
            data={rooms}
            keyExtractor={(r) => r.id}
            renderItem={renderRoom}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Aún no hay salas disponibles.{'\n'}Vuelve pronto.
              </Text>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0f0f14' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24,
                 backgroundColor: '#18181f', borderBottomWidth: 1, borderBottomColor: '#2d2d3a' },
  greeting:    { color: '#f8f8ff', fontSize: 20, fontWeight: '600' },
  roleBadge:   { marginTop: 4, backgroundColor: '#064e3b', borderRadius: 6,
                 paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  roleText:    { color: '#6ee7b7', fontSize: 12, fontWeight: '500' },
  avatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981',
                 justifyContent: 'center', alignItems: 'center' },
  avatarText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtitle:    { color: '#9ca3af', fontSize: 15, paddingHorizontal: 20,
                 paddingTop: 24, paddingBottom: 8 },
  roomCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181f',
                 borderRadius: 14, padding: 16, marginBottom: 10,
                 borderWidth: 1, borderColor: '#2d2d3a' },
  roomIcon:    { width: 40, height: 40, borderRadius: 10, backgroundColor: '#064e3b',
                 justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  roomIconText: { color: '#6ee7b7', fontSize: 20, fontWeight: '700' },
  roomName:    { color: '#f8f8ff', fontSize: 16, fontWeight: '600' },
  roomMeta:    { color: '#6b7280', fontSize: 12, marginTop: 2 },
  chevron:     { color: '#6b7280', fontSize: 22 },
  emptyText:   { color: '#6b7280', textAlign: 'center', marginTop: 40,
                 fontSize: 15, lineHeight: 24 },
});
```

### `app/(app)/chat/[roomId].tsx` — Ventana de chat compartida

```typescript
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/presentation/store/authStore';
import { useChat } from '@/src/features/chat/presentation/hooks/useChat';
import { Message } from '@/src/features/chat/domain/entities/Message';
import { getUserInitials } from '@/src/features/auth/domain/entities/User';

export default function ChatRoom() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const user       = useAuthStore((s) => s.user);
  const router     = useRouter();
  const { messages, isLoading, sendMessage, subscribeToRoom } = useChat(roomId);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToRoom(roomId);
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !roomId) return;
    const content = text.trim();
    setText('');
    await sendMessage(roomId, content);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.author.id === user?.id;
    const isSeller = item.author.role === 'seller';
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={[styles.msgAvatar, isSeller ? styles.sellerAvatar : styles.clientAvatar]}>
            <Text style={styles.msgAvatarText}>
              {getUserInitials(item.author)}
            </Text>
          </View>
        )}
        <View style={{ maxWidth: '72%' }}>
          {!isOwn && (
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>{item.author.username}</Text>
              <View style={[styles.miniRoleBadge, isSeller ? styles.sellerBadge : styles.clientBadge]}>
                <Text style={[styles.miniRoleText, isSeller ? styles.sellerBadgeText : styles.clientBadgeText]}>
                  {isSeller ? 'Vendedor' : 'Cliente'}
                </Text>
              </View>
            </View>
          )}
          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
              {item.content}
            </Text>
          </View>
          <Text style={[styles.timeText, isOwn && styles.timeTextOwn]}>
            {new Date(item.createdAt).toLocaleTimeString('es-EC', {
              hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Text style={{ color: '#a5b4fc', fontSize: 18, fontWeight: '700' }}>#</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{roomId}</Text>
          <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
        </View>

        {/* Mensajes */}
        {isLoading
          ? <ActivityIndicator style={{ flex: 1 }} color="#6366f1" />
          : <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatEmoji}>💬</Text>
                  <Text style={styles.emptyChatText}>Sé el primero en escribir</Text>
                </View>
              }
            />
        }

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={
              user?.role === 'client'
                ? 'Escribe tu pregunta sobre el producto...'
                : 'Responde al cliente...'
            }
            placeholderTextColor="#6b7280"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0f0f14' },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
                     paddingTop: 56, paddingBottom: 16, backgroundColor: '#18181f',
                     borderBottomWidth: 1, borderBottomColor: '#2d2d3a', gap: 10 },
  backBtn:         { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backBtnText:     { color: '#a5b4fc', fontSize: 28, fontWeight: '300' },
  headerIcon:      { width: 32, height: 32, borderRadius: 8, backgroundColor: '#312e81',
                     justifyContent: 'center', alignItems: 'center' },
  headerTitle:     { flex: 1, color: '#f8f8ff', fontSize: 17, fontWeight: '600' },
  statusDot:       { width: 8, height: 8, borderRadius: 4 },
  messageList:     { padding: 16, paddingBottom: 8, flexGrow: 1 },
  messageRow:      { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', gap: 8 },
  messageRowOwn:   { flexDirection: 'row-reverse' },
  msgAvatar:       { width: 32, height: 32, borderRadius: 16,
                     justifyContent: 'center', alignItems: 'center' },
  sellerAvatar:    { backgroundColor: '#6366f1' },
  clientAvatar:    { backgroundColor: '#10b981' },
  msgAvatarText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  authorRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  authorName:      { color: '#9ca3af', fontSize: 12, fontWeight: '500' },
  miniRoleBadge:   { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  sellerBadge:     { backgroundColor: '#312e81' },
  clientBadge:     { backgroundColor: '#064e3b' },
  miniRoleText:    { fontSize: 10, fontWeight: '600' },
  sellerBadgeText: { color: '#a5b4fc' },
  clientBadgeText: { color: '#6ee7b7' },
  bubble:          { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwn:       { backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  bubbleOther:     { backgroundColor: '#1e1e2a', borderBottomLeftRadius: 4,
                     borderWidth: 1, borderColor: '#2d2d3a' },
  bubbleText:      { color: '#d1d5db', fontSize: 15, lineHeight: 21 },
  bubbleTextOwn:   { color: '#fff' },
  timeText:        { color: '#4b5563', fontSize: 11, marginTop: 4, marginLeft: 4 },
  timeTextOwn:     { textAlign: 'right', marginRight: 4 },
  emptyChat:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatEmoji:  { fontSize: 40, marginBottom: 12 },
  emptyChatText:   { color: '#4b5563', fontSize: 15 },
  inputBar:        { flexDirection: 'row', padding: 12, paddingBottom: 28,
                     backgroundColor: '#18181f', borderTopWidth: 1, borderTopColor: '#2d2d3a',
                     gap: 10, alignItems: 'flex-end' },
  input:           { flex: 1, backgroundColor: '#0f0f14', borderRadius: 20, paddingHorizontal: 16,
                     paddingVertical: 10, color: '#f8f8ff', fontSize: 15, maxHeight: 120,
                     borderWidth: 1, borderColor: '#2d2d3a' },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1',
                     justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText:     { color: '#fff', fontSize: 20, fontWeight: '600' },
});
```

---

## Paso 7 — Hooks de chat

### `src/features/chat/presentation/hooks/useRooms.ts`

```typescript
import { useState, useCallback } from 'react';
import { Room } from '../../domain/entities/Room';
import { createRoomUseCase } from '@/src/di/container';
import { supabase } from '@/src/shared/infrastructure/supabase/client';

export function useRooms() {
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, created_by, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRooms((data ?? []).map((r: any) => ({
        id: r.id, name: r.name, createdBy: r.created_by, createdAt: r.created_at,
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rooms, isLoading, error, loadRooms };
}
```

### `src/features/chat/presentation/hooks/useChat.ts`

```typescript
import { useState, useCallback } from 'react';
import { Message } from '../../domain/entities/Message';
import { getMessagesUseCase, sendMessageUseCase, subscribeToRoomUseCase } from '@/src/di/container';

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const data = await getMessagesUseCase.execute(roomId);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const sendMessage = useCallback(async (roomId: string, content: string) => {
    await sendMessageUseCase.execute(roomId, content);
  }, []);

  const subscribeToRoom = useCallback((roomId: string) => {
    loadMessages();
    return subscribeToRoomUseCase.execute(roomId, (newMessage) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMessage.id);
        return exists ? prev : [...prev, newMessage];
      });
    });
  }, [roomId]);

  return { messages, isLoading, sendMessage, subscribeToRoom };
}
```

---

## Paso 8 — Video 2: migración a AppWrite

Crear este archivo. **No modificar nada más.**

### `src/features/chat/infrastructure/repositories/AppwriteChatRepository.ts`

```typescript
/**
 * VIDEO 2: Migración de Supabase Realtime → AppWrite
 *
 * Este archivo implementa IChatRepository usando AppWrite.
 * Para activar la migración: abrir src/di/container.ts y
 * cambiar SupabaseChatRepository por AppwriteChatRepository.
 * NADA MÁS cambia en toda la aplicación.
 */
import { Client, Databases, ID, Query, Realtime } from 'react-native-appwrite';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Message } from '../../domain/entities/Message';
import { Room, CreateRoomDTO } from '../../domain/entities/Room';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);
const DB_ID     = process.env.EXPO_PUBLIC_APPWRITE_DB_ID!;

export class AppwriteChatRepository implements IChatRepository {

  async getMessages(roomId: string): Promise<Message[]> {
    const res = await databases.listDocuments(DB_ID, 'messages', [
      Query.equal('room_id', roomId),
      Query.orderAsc('$createdAt'),
    ]);
    return res.documents.map(this.mapMessage);
  }

  async sendMessage(roomId: string, content: string): Promise<Message> {
    const doc = await databases.createDocument(DB_ID, 'messages', ID.unique(), {
      room_id: roomId,
      content,
    });
    return this.mapMessage(doc);
  }

  subscribeToRoom(roomId: string, onMessage: (msg: Message) => void): () => void {
    const unsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.messages.documents`,
      (response) => {
        if (
          response.events.includes('databases.*.collections.*.documents.*.create') &&
          (response.payload as any).room_id === roomId
        ) {
          onMessage(this.mapMessage(response.payload as any));
        }
      }
    );
    // Misma firma de cleanup que Supabase — la UI no se entera del cambio
    return unsubscribe;
  }

  async getRooms(): Promise<Room[]> {
    const res = await databases.listDocuments(DB_ID, 'rooms', [
      Query.orderDesc('$createdAt'),
    ]);
    return res.documents.map(this.mapRoom);
  }

  async createRoom(dto: CreateRoomDTO): Promise<Room> {
    const doc = await databases.createDocument(DB_ID, 'rooms', ID.unique(), {
      name: dto.name,
    });
    return this.mapRoom(doc);
  }

  async joinRoom(roomId: string): Promise<void> {
    await databases.createDocument(DB_ID, 'room_members', ID.unique(), {
      room_id: roomId,
    });
  }

  private mapMessage(doc: any): Message {
    return {
      id:        doc.$id,
      roomId:    doc.room_id,
      content:   doc.content,
      createdAt: doc.$createdAt,
      author: {
        id:        doc.user_id ?? '',
        username:  doc.username ?? 'Usuario',
        avatarUrl: doc.avatar_url ?? null,
        role:      doc.role ?? 'client',
      },
    };
  }

  private mapRoom(doc: any): Room {
    return {
      id:        doc.$id,
      name:      doc.name,
      createdBy: doc.created_by ?? '',
      createdAt: doc.$createdAt,
    };
  }
}
```

---

## Resumen de archivos

| Acción | Archivo |
|--------|---------|
| **Modificar** | `src/features/auth/domain/entities/User.ts` |
| **Modificar** | `src/features/auth/domain/repositories/IAuthRepository.ts` |
| **Modificar** | `src/features/auth/infrastructure/repositories/SupabaseAuthRepository.ts` |
| **Modificar** | `src/features/auth/application/use-cases/RegisterUseCase.ts` |
| **Modificar** | `src/features/auth/presentation/store/authStore.ts` |
| **Modificar** | `src/features/auth/presentation/hooks/useAuth.ts` |
| **Modificar** | `src/features/chat/domain/repositories/IChatRepository.ts` |
| **Modificar** | `src/features/chat/domain/entities/Message.ts` |
| **Modificar** | `src/features/chat/infrastructure/repositories/SupabaseChatRepository.ts` |
| **Modificar** | `src/features/chat/presentation/hooks/useChat.ts` |
| **Modificar** | `src/features/chat/presentation/hooks/useRooms.ts` |
| **Modificar** | `app/(app)/index.tsx` |
| **Crear** | `src/features/chat/domain/entities/Room.ts` |
| **Crear** | `src/features/auth/application/use-cases/CreateRoomUseCase.ts` |
| **Crear** | `src/di/container.ts` |
| **Crear** | `components/RoleGuard.tsx` |
| **Crear** | `app/(app)/seller/_layout.tsx` |
| **Crear** | `app/(app)/seller/index.tsx` |
| **Crear** | `app/(app)/client/_layout.tsx` |
| **Crear** | `app/(app)/client/index.tsx` |
| **Crear** | `src/features/chat/infrastructure/repositories/AppwriteChatRepository.ts` |
