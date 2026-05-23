import { useState, useCallback } from 'react';
import { Message } from '../../domain/entities/Message';
import { getMessagesUseCase, sendMessageUseCase, subscribeToRoomUseCase } from '../../../../di/container';

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
  }, [roomId, loadMessages]);

  return { messages, isLoading, sendMessage, subscribeToRoom };
}
