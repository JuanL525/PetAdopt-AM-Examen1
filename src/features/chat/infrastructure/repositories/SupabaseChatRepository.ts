import { supabase } from '@shared/infrastructure/supabase/client';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Message } from '../../domain/entities/Message';
import { Room, CreateRoomDTO } from '../../domain/entities/Room';
import { AppError } from '@shared/domain/errors/AppError';

export class SupabaseChatRepository implements IChatRepository {

  async getMessages(roomId: string): Promise<Message[]> {
    await this.joinRoom(roomId).catch(() => {});

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, room_id,
        profiles:user_id ( id, username, avatar_url, role )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw new AppError('MESSAGES_FETCH_FAILED', error.message);
    return (data ?? []).map((m: any) => this.mapMessage(m));
  }

  async sendMessage(roomId: string, content: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AppError('AUTH_REQUIRED', 'No autenticado');

    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, user_id: user.id, content })
      .select(`
        id, content, created_at, room_id,
        profiles:user_id ( id, username, avatar_url, role )
      `)
      .single();

    if (error) throw new AppError('MESSAGE_SEND_FAILED', error.message);
    return this.mapMessage(data);
  }

  subscribeToRoom(roomId: string, onMessage: (message: Message) => void): () => void {
    this.joinRoom(roomId).catch(() => {});

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

    if (error) throw new AppError('ROOMS_FETCH_FAILED', error.message);
    return (data ?? []).map((r: any) => this.mapRoom(r));
  }

  async createRoom(dto: CreateRoomDTO): Promise<Room> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AppError('AUTH_REQUIRED', 'No autenticado');

    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: dto.name, created_by: user.id })
      .select()
      .single();

    if (error) throw new AppError('ROOM_CREATE_FAILED', error.message);

    // Unir automáticamente al creador
    await this.joinRoom(data.id);
    return this.mapRoom(data);
  }

  async joinRoom(roomId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AppError('AUTH_REQUIRED', 'No autenticado');

    // ignoreDuplicates evita UPDATE en conflicto (RLS suele permitir INSERT pero no UPDATE)
    const { error } = await supabase
      .from('room_members')
      .upsert(
        { room_id: roomId, user_id: user.id },
        { onConflict: 'room_id,user_id', ignoreDuplicates: true },
      );

    if (error) throw new AppError('ROOM_JOIN_FAILED', error.message);
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
