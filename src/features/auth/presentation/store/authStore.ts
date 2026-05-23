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
