import { useState, useCallback } from 'react';
import { Room } from '../../domain/entities/Room';
import { supabase } from '@shared/infrastructure/supabase/client';

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
