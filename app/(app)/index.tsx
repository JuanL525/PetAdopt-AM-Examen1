import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { View, ActivityIndicator } from 'react-native';

/**
 * Puerta de entrada tras el login.
 * Lee el rol y redirige a la pantalla correcta.
 */
export default function AppIndex() {
  const user  = useAuthStore((s) => s.user);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    const id = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      if (user.role === 'seller') {
        router.replace('/(app)/seller');
      } else {
        router.replace('/(app)/client');
      }
    }, 0);
    return () => clearTimeout(id);
  }, [user, router, rootNavigationState?.key]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f14' }}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}
