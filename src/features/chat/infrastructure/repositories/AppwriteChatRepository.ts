import { Client, Databases, ID, Query } from 'react-native-appwrite';
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
    return res.documents.map((doc: any) => this.mapMessage(doc));
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
    return res.documents.map((doc: any) => this.mapRoom(doc));
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
