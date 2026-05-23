import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { UserRole } from '@features/auth/domain/entities/User';

interface RoleGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

/**
 * Redirige al usuario si su rol no coincide con el permitido.
 * Uso en layouts: <RoleGuard allowedRole="seller"><Slot /></RoleGuard>
 */
export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    if (user.role !== allowedRole) {
      // Redirigir a su pantalla correcta
      router.replace(user.role === 'seller' ? '/(app)/seller' : '/(app)/client');
    }
  }, [user, allowedRole, router]);

  if (!user || user.role !== allowedRole) return null;
  return <>{children}</>;
}
