import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { useAdoptions } from '@features/adoptions/presentation/hooks/useAdoptions';
import { AdoptionRequest } from '@features/adoptions/domain/entities/AdoptionRequest';
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetBadge, PetText, PetButton,
} from '@shared/design';
import { LottieAnimation } from '../../../components/animations/LottieAnimation';
const loadingAnimation = require('../../../assets/animations/loading-cat.json');
const emptyAnimation   = require('../../../assets/animations/empty-dog.json');

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error'> = {
  pending:  'warning',
  approved: 'success',
  rejected: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada',
};

export default function AdoptionsScreen() {
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requests, isLoading, loadRequests } = useAdoptions();
  const isRefugio = user?.role === 'refugio';

  useEffect(() => { loadRequests(); }, [loadRequests]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + space[4],
          paddingHorizontal: space[5],
          paddingBottom: space[4],
          backgroundColor: c.bgSurface,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[3],
          ...shadow.sm,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.full,
              backgroundColor: c.bgSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={c.textPrimary} />
          </View>
        </Pressable>

        <View style={{ flex: 1 }}>
          <PetText variant="h3">{isRefugio ? 'Solicitudes recibidas' : 'Mis solicitudes'}</PetText>
          {!isLoading && (
            <PetText variant="caption">{requests.length} en total</PetText>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LottieAnimation source={loadingAnimation} size={140} loop />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadRequests}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: space[8], gap: space[4] }}>
              <LottieAnimation source={emptyAnimation} size={180} loop />
              <PetText variant="h3" align="center">
                {isRefugio ? 'Sin solicitudes aún' : 'No tienes solicitudes'}
              </PetText>
              {!isRefugio && (
                <View style={{ width: 240 }}>
                  <PetButton
                    label="Ver mascotas disponibles"
                    onPress={() => router.push('/(app)/pets' as any)}
                    variant="outline"
                  />
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }: { item: AdoptionRequest; index: number }) => (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200, delay: index * 55 }}
            >
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(app)/adoptions/[requestId]', params: { requestId: item.id } })
                }
              >
                {({ pressed }) => (
                  <MotiView
                    animate={{ scale: pressed ? 0.99 : 1 }}
                    transition={{ type: 'timing', duration: 100 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: c.bgSurface,
                      borderRadius: radius.xl,
                      padding: space[4],
                      gap: space[3],
                      borderWidth: 1,
                      borderColor: pressed ? c.primary + '44' : c.border,
                      ...shadow.sm,
                    }}
                  >
                    {/* Pet thumbnail */}
                    <View style={{ width: 60, height: 60, borderRadius: radius.md, overflow: 'hidden' }}>
                      {item.petPhotoUrl ? (
                        <Image source={{ uri: item.petPhotoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: c.primaryLight,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 26 }}>🐾</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: c.textPrimary }}>
                        {item.petName ?? 'Mascota'}
                      </Text>
                      <Text style={{ fontSize: fontSize.sm, color: c.textMuted }}>
                        {isRefugio
                          ? `Solicitante: ${item.adopterName ?? 'Usuario'}`
                          : `Refugio: ${item.shelterName ?? 'Refugio'}`}
                      </Text>
                      <Text style={{ fontSize: 11, color: c.textMuted }}>
                        {new Date(item.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>

                    {/* Status + arrow */}
                    <View style={{ alignItems: 'flex-end', gap: space[2] }}>
                      <PetBadge
                        label={STATUS_LABEL[item.status] ?? item.status}
                        variant={STATUS_VARIANT[item.status] ?? 'neutral' as any}
                        size="sm"
                      />
                      <MaterialCommunityIcons name="chevron-right" size={18} color={c.textMuted} />
                    </View>
                  </MotiView>
                )}
              </Pressable>
            </MotiView>
          )}
        />
      )}
    </View>
  );
}
