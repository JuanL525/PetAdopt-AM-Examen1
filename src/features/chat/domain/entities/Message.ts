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