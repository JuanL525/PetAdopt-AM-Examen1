import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { petRepository, chatRepository } from '../../../src/di/container';
import { LottieAnimation } from '../../../components/animations/LottieAnimation';
const loadingAnimation = require('../../../assets/animations/loading-cat.json');
const successAnimation = require('../../../assets/animations/success-dogs.json');
import { Pet, formatPetAge } from '@features/pets/domain/entities/Pet';
import { useAdoptions } from '@features/adoptions/presentation/hooks/useAdoptions';
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetBadge, PetButton, PetText,
} from '@shared/design';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = {
  available: 'success', pending: 'warning', adopted: 'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible', adopted: 'Adoptado', pending: 'En proceso',
};
const SIZE_LABEL: Record<string, string> = {
  small: 'Pequeño', medium: 'Mediano', large: 'Grande',
};

export default function PetDetailScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { createRequest, requests, loadRequests } = useAdoptions();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [adoptMessage, setAdoptMessage] = useState('');
  const [adopting, setAdopting] = useState(false);
  const isAdoptante = user?.role === 'adoptante';

  useEffect(() => {
    if (petId) {
      petRepository.getPetById(petId).then(setPet).catch(console.error).finally(() => setLoading(false));
    }
  }, [petId]);

  useEffect(() => {
    if (isAdoptante) loadRequests();
  }, [isAdoptante, loadRequests]);

  // Mi solicitud (si existe) para esta mascota
  const myRequest = pet ? requests.find((r) => r.petId === pet.id) : undefined;

  const handleAdopt = async () => {
    if (!pet) return;
    setAdopting(true);
    try {
      await createRequest({ petId: pet.id, shelterId: pet.shelterId, message: adoptMessage.trim() || undefined });
      setShowAdoptModal(false);
      setAdoptMessage('');
      await loadRequests();
      setShowRequestSuccess(true);
      setTimeout(() => setShowRequestSuccess(false), 3200);
    } catch (e: any) {
      Alert.alert('No se pudo enviar', e.message);
    } finally {
      setAdopting(false);
    }
  };

  const handleChat = async () => {
    if (!pet) return;

    let roomId = pet.roomId;

    if (!roomId) {
      // La sala no fue creada al registrar la mascota — la creamos ahora
      try {
        const room = await chatRepository.createRoom({ name: `Chat · ${pet.name}` });
        roomId = room.id;

        // Intentar persistir el room_id en la mascota (puede fallar por RLS si no eres el refugio)
        try {
          await petRepository.updatePet({ id: pet.id, roomId });
        } catch {
          // Silencioso: si falla, igual continuamos con la sala recién creada
        }

        // Actualizar el estado local para que el botón funcione sin recargar
        setPet({ ...pet, roomId });
      } catch (e: any) {
        Alert.alert(
          'Error al abrir el chat',
          'No se pudo crear la sala de chat. Verifica tu conexión e intenta de nuevo.\n\n' +
          (e?.message ?? ''),
        );
        return;
      }
    }

    try {
      await chatRepository.joinRoom(roomId);
    } catch {
      // Ya miembro o fallo no crítico — abrir chat igual (getMessages reintenta unirse)
    }
    router.push(`/(app)/chat/${roomId}` as any);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgPage, justifyContent: 'center', alignItems: 'center' }}>
        <LottieAnimation source={loadingAnimation} size={140} loop />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgPage, justifyContent: 'center', alignItems: 'center', gap: space[4] }}>
        <Text style={{ fontSize: 56 }}>🐾</Text>
        <PetText variant="h3">Mascota no encontrada</PetText>
        <PetButton label="Volver" onPress={() => router.back()} variant="outline" fullWidth={false} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView contentContainerStyle={{ paddingBottom: isAdoptante ? 160 : 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ width: '100%', height: 300, position: 'relative' }}>
          {pet.photoUrl ? (
            <Image source={{ uri: pet.photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 80 }}>🐾</Text>
            </View>
          )}
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={{ position: 'absolute', top: insets.top + space[3], left: space[4] }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radius.full,
                backgroundColor: 'rgba(255,255,255,0.9)',
                alignItems: 'center',
                justifyContent: 'center',
                ...shadow.md,
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={c.textPrimary} />
            </View>
          </Pressable>
        </View>

        {/* Content */}
        <View style={{ padding: space[5], gap: space[5] }}>
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 80 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[2] }}>
              <Text style={{ fontSize: fontSize['3xl'], fontWeight: fontWeight.extrabold, color: c.textPrimary, flex: 1 }}>
                {pet.name}
              </Text>
              <PetBadge
                label={STATUS_LABEL[pet.status] ?? pet.status}
                variant={STATUS_VARIANT[pet.status] ?? 'neutral'}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: space[4], flexWrap: 'wrap' }}>
              {[
                { icon: 'dog', text: pet.breed },
                { icon: 'calendar-outline', text: formatPetAge(pet.age) },
                { icon: 'resize', text: SIZE_LABEL[pet.size] ?? pet.size },
              ].map((m) => (
                <View key={m.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: space[1] }}>
                  <MaterialCommunityIcons name={m.icon as any} size={16} color={c.textMuted} />
                  <Text style={{ fontSize: fontSize.sm, color: c.textSecondary }}>{m.text}</Text>
                </View>
              ))}
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 160 }}
          >
            <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: space[2] }}>
              Sobre {pet.name}
            </Text>
            <Text style={{ fontSize: fontSize.base, color: c.textSecondary, lineHeight: 24 }}>
              {pet.description || 'Sin descripción disponible.'}
            </Text>
          </MotiView>

          {pet.shelterName && (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 240 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[3],
              backgroundColor: c.infoBg,
              borderRadius: radius.lg,
              padding: space[4],
              borderWidth: 1,
              borderColor: c.infoBorder,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: '#DBEAFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="home-heart" size={22} color={c.info} />
              </View>
              <View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.info, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Refugio a cargo
                </Text>
                <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: '#1D4ED8', marginTop: 2 }}>
                  {pet.shelterName}
                </Text>
              </View>
            </MotiView>
          )}
        </View>
      </ScrollView>

      {/* Action buttons (adoptante only) */}
      {isAdoptante && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 320 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: space[5],
            paddingBottom: insets.bottom + space[5],
            backgroundColor: c.bgSurface,
            borderTopWidth: 1,
            borderTopColor: c.border,
            gap: space[3],
            ...shadow.lg,
          }}
        >
          <PetButton
            label="Chat con refugio"
            onPress={handleChat}
            variant="secondary"
            icon={<MaterialCommunityIcons name="chat-outline" size={18} color="#fff" />}
          />

          {/* Estado / acción de adopción según mi solicitud y disponibilidad */}
          {myRequest?.status === 'approved' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[2],
                paddingVertical: space[3],
                borderRadius: radius.lg,
                backgroundColor: c.successBg,
                borderWidth: 1,
                borderColor: c.success + '55',
              }}
            >
              <MaterialCommunityIcons name="check-decagram" size={20} color={c.success} />
              <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: c.success }}>
                ¡Adoptaste a {pet.name}!
              </Text>
            </View>
          ) : myRequest?.status === 'pending' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[2],
                paddingVertical: space[3],
                borderRadius: radius.lg,
                backgroundColor: c.warningBg,
                borderWidth: 1,
                borderColor: c.warning + '55',
              }}
            >
              <MaterialCommunityIcons name="clock-outline" size={20} color={c.warning} />
              <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: c.warning }}>
                Solicitud enviada · en revisión
              </Text>
            </View>
          ) : pet.status === 'adopted' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space[2],
                paddingVertical: space[3],
                borderRadius: radius.lg,
                backgroundColor: c.bgSubtle,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <MaterialCommunityIcons name="home-heart" size={20} color={c.textMuted} />
              <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: c.textMuted }}>
                Esta mascota ya fue adoptada
              </Text>
            </View>
          ) : (
            <PetButton
              label={myRequest?.status === 'rejected' ? 'Volver a solicitar' : 'Solicitar adopción'}
              onPress={() => setShowAdoptModal(true)}
              icon={<MaterialCommunityIcons name="heart" size={18} color="#fff" />}
            />
          )}
        </MotiView>
      )}

      {/* Success modal — solicitud enviada */}
      <Modal visible={showRequestSuccess} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(15,15,13,0.96)' : 'rgba(250,250,248,0.97)', justifyContent: 'center', alignItems: 'center', gap: space[4], padding: space[6] }}>
          <LottieAnimation source={successAnimation} size={200} loop={false} autoPlay />
          <PetText variant="h2" align="center">¡Solicitud enviada!</PetText>
          <PetText variant="body" align="center">
            El refugio revisará tu solicitud para adoptar a {pet?.name}. Te avisaremos cuando tengan una respuesta.
          </PetText>
        </View>
      </Modal>

      {/* Adopt Modal */}
      <Modal visible={showAdoptModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(45,55,72,0.6)', justifyContent: 'flex-end' }}>
          <MotiView
            from={{ translateY: 200 }}
            animate={{ translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            style={{
              backgroundColor: c.bgSurface,
              borderTopLeftRadius: radius['2xl'],
              borderTopRightRadius: radius['2xl'],
              padding: space[6],
              paddingBottom: insets.bottom + space[6],
              gap: space[4],
              borderTopWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.textPrimary }}>
              Solicitar adopción de {pet.name}
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: c.textMuted }}>
              Escribe un mensaje al refugio (opcional)
            </Text>

            <View
              style={{
                borderWidth: 1.5,
                borderRadius: radius.lg,
                borderColor: c.border,
                backgroundColor: c.bgSubtle,
                padding: space[4],
                minHeight: 100,
              }}
            >
              <TextInput
                value={adoptMessage}
                onChangeText={setAdoptMessage}
                placeholder="Cuéntanos por qué quieres adoptar a esta mascota..."
                placeholderTextColor={c.textMuted}
                multiline
                numberOfLines={4}
                style={{ fontSize: fontSize.base, color: c.textPrimary, lineHeight: 22, textAlignVertical: 'top' }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: space[3] }}>
              <View style={{ flex: 1 }}>
                <PetButton label="Cancelar" onPress={() => setShowAdoptModal(false)} variant="outline" />
              </View>
              <View style={{ flex: 2 }}>
                <PetButton label="Enviar solicitud" onPress={handleAdopt} loading={adopting} />
              </View>
            </View>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}
