import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { loginUseCase, registerUseCase, logoutUseCase } from '../../../../di/container';
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
  }, [setUser, setLoading, setError]);

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
  }, [setUser, setLoading, setError]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await logoutUseCase.execute();
      reset();
    } catch (e: any) {
      setError(e.message ?? 'Error al cerrar sesión');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [reset, setLoading, setError]);

  return { user, isLoading, error, login, register, logout };
}
