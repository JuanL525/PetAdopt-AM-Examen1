import { useState, useCallback } from 'react';
import { Room } from '../../domain/entities/Room';
import { chatRepository } from '../../../../di/container';

export function useRooms() {
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      //const { data } = await supabase.from('rooms').select(...)
      const data = await chatRepository.getRooms();
      setRooms(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar las salas');
    } finally {
      setLoading(false);
    }
  }, []);

  return { rooms, isLoading, error, loadRooms };
}
