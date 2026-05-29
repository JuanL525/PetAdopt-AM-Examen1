import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { adoptionRepository } from '../../../src/di/container';
import { AdoptionRequest } from '@features/adoptions/domain/entities/AdoptionRequest';
import { useAdoptions } from '@features/adoptions/presentation/hooks/useAdoptions';
import { LottieAnimation } from '../../../components/animations/LottieAnimation';
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetBadge, PetButton, PetText,
} from '@shared/design';
const loadingAnimation = require('../../../assets/animations/loading-cat.json');
const successAnimation = require('../../../assets/animations/success-dogs.json');

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error'> = {
  pending:  'warning',
  approved: 'success',
  rejected: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pendiente', approved: '✅ Aprobada', rejected: '❌ Rechazada',
};

export default function AdoptionDetailScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { approveRequest, rejectRequest } = useAdoptions();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  const [request, setRequest] = useState<AdoptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isRefugio = user?.role === 'refugio';

  useEffect(() => {
    if (!requestId) return;
    (async () => {
      try {
        const { supabase } = await import('@shared/infrastructure/supabase/client');
        const SELECT_QUERY = `*, pets(name, photo_url), adopter:profiles!adoption_requests_adopter_id_fkey(username), shelter:profiles!adoption_requests_shelter_id_fkey(username)`;
        const { data } = await supabase.from('adoption_requests').select(SELECT_QUERY).eq('id', requestId).single();
        if (data) {
          const { createAdoptionFactory } = await import('@features/adoptions/domain/entities/AdoptionRequest');
          setRequest(createAdoptionFactory(data));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  const handleApprove = () => {
    if (!requestId) return;
    Alert.alert('Aprobar solicitud', '¿Confirmas la aprobación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: async () => {
          setProcessing(true);
          try {
            const updated = await approveRequest(requestId);
            setRequest(updated);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    if (!requestId) return;
    Alert.alert('Rechazar solicitud', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            const updated = await rejectRequest(requestId);
            setRequest(updated);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgPage, justifyContent: 'center', alignItems: 'center' }}>
        <LottieAnimation source={loadingAnimation} size={220} loop />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgPage, justifyContent: 'center', alignItems: 'center', gap: space[4] }}>
        <Text style={{ fontSize: 56 }}>📋</Text>
        <PetText variant="h3">Solicitud no encontrada</PetText>
        <PetButton label="Volver" onPress={() => router.back()} variant="outline" fullWidth={false} />
      </View>
    );
  }

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
          <View style={{ width: 38, height: 38, borderRadius: radius.full, backgroundColor: c.bgSubtle, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={c.textPrimary} />
          </View>
        </Pressable>
        <PetText variant="h3">Solicitud de adopción</PetText>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space[5], gap: space[4], paddingBottom: isRefugio && request.status === 'pending' ? 140 : space[10] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet card */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 80 }}
          style={{
            flexDirection: 'row',
            backgroundColor: c.bgSurface,
            borderRadius: radius.xl,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: c.border,
            ...shadow.sm,
          }}
        >
          <View style={{ width: 100, height: 100 }}>
            {request.petPhotoUrl ? (
              <Image source={{ uri: request.petPhotoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 40 }}>🐾</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, padding: space[4], justifyContent: 'center', gap: space[1] }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textPrimary }}>
              {request.petName ?? 'Mascota'}
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: c.info }}>
              🏠 {request.shelterName ?? 'Refugio'}
            </Text>
          </View>
        </MotiView>

        {/* Status */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 140 }}
          style={{ backgroundColor: c.bgSurface, borderRadius: radius.xl, padding: space[5], borderWidth: 1, borderColor: c.border, gap: space[3], ...shadow.sm }}
        >
          <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Estado de la solicitud
          </Text>
          <PetBadge
            label={STATUS_LABEL[request.status] ?? request.status}
            variant={STATUS_VARIANT[request.status] ?? 'neutral' as any}
          />
        </MotiView>

        {/* Adopter info */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 200 }}
          style={{ backgroundColor: c.bgSurface, borderRadius: radius.xl, padding: space[5], borderWidth: 1, borderColor: c.border, gap: space[3], ...shadow.sm }}
        >
          <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Información del adoptante
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="account-circle-outline" size={22} color={c.primary} />
            </View>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: c.textPrimary }}>
              {request.adopterName ?? 'Usuario'}
            </Text>
          </View>
        </MotiView>

        {/* Message */}
        {request.message && (
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 260 }}
            style={{ backgroundColor: c.bgSurface, borderRadius: radius.xl, padding: space[5], borderWidth: 1, borderColor: c.border, gap: space[3], ...shadow.sm }}
          >
            <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
              Mensaje del adoptante
            </Text>
            <Text style={{ fontSize: fontSize.base, color: c.textSecondary, lineHeight: 24 }}>
              "{request.message}"
            </Text>
          </MotiView>
        )}

        {/* Date */}
        <Text style={{ fontSize: fontSize.xs, color: c.textMuted, textAlign: 'center' }}>
          Enviada el {new Date(request.createdAt).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </ScrollView>

      {/* Actions (refugio only, pending only) */}
      {isRefugio && request.status === 'pending' && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 300 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            padding: space[5],
            paddingBottom: insets.bottom + space[5],
            gap: space[3],
            backgroundColor: c.bgSurface,
            borderTopWidth: 1,
            borderTopColor: c.border,
            ...shadow.lg,
          }}
        >
          <View style={{ flex: 1 }}>
            <PetButton label="Rechazar" onPress={handleReject} loading={processing} variant="outline" />
          </View>
          <View style={{ flex: 1.3 }}>
            <PetButton label="Aprobar" onPress={handleApprove} loading={processing}
              icon={<MaterialCommunityIcons name="check" size={18} color="#fff" />} />
          </View>
        </MotiView>
      )}

      {/* Success modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(250,250,248,0.97)', justifyContent: 'center', alignItems: 'center', gap: space[4] }}>
          <LottieAnimation source={successAnimation} size={280} loop={false} autoPlay />
          <PetText variant="h2" align="center">¡Solicitud aprobada! 🎉</PetText>
          <PetText variant="body" align="center">El adoptante recibirá una notificación.</PetText>
        </View>
      </Modal>
    </View>
  );
}
