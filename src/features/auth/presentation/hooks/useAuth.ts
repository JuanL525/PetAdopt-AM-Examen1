import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { loginUseCase, registerUseCase, logoutUseCase, loginWithGoogleUseCase, forgotPasswordUseCase } from '../../../../di/container';
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

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogleUseCase.execute();
      // NO llamamos a setUser() ni a setLoading(false) aquí en caso de éxito,
      // ya que el flujo reactivo de onAuthStateChange en _layout.tsx se encargará
      // de inyectar el usuario y apagar el estado de carga al completarse el login.
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión con Google');
      setLoading(false);
      throw e;
    }
  }, [setLoading, setError]);

  const forgotPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await forgotPasswordUseCase.execute(email);
    } catch (e: any) {
      setError(e.message ?? 'Error al enviar el correo de recuperación');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

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

  return { user, isLoading, error, login, register, loginWithGoogle, logout, forgotPassword };
}
