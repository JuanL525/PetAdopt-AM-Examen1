import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { View } from 'react-native';
import { useColors } from '@shared/design';
import { LottieAnimation } from '../../components/animations/LottieAnimation';
const loadingAnimation = require('../../assets/animations/loading-cat.json');

/**
 * Puerta de entrada tras el login.
 * Lee el rol y redirige a la pantalla correcta.
 */
export default function AppIndex() {
  const user  = useAuthStore((s) => s.user);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const c = useColors();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    const id = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      if (user.role === 'refugio') {
        router.replace('/(app)/refugio' as any);
      } else {
        router.replace('/(app)/adoptante' as any);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [user, router, rootNavigationState?.key]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bgPage }}>
      <LottieAnimation source={loadingAnimation} size={140} loop />
    </View>
  );
}
