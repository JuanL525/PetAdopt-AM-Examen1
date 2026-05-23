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