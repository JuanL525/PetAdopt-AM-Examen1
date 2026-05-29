import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { petRepository, chatRepository } from '../../src/di/container';
import { Pet } from '@features/pets/domain/entities/Pet';
import { useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize, PetText } from '@shared/design';
import { LottieAnimation } from '../../components/animations/LottieAnimation';
const loadingAnimation = require('../../assets/animations/loading-cat.json');
const emptyAnimation   = require('../../assets/animations/empty-dog.json');

export default function ChatsScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    petRepository
      .getPetsByShelterId(user.id)
      .then((data) => setPets(data.filter((p) => p.roomId !== null)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const openChat = async (pet: Pet) => {
    if (!pet.roomId) return;
    try {
      await chatRepository.joinRoom(pet.roomId);
    } catch {
      // already a member
    }
    router.push(`/(app)/chat/${pet.roomId}` as any);
  };

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
          <PetText variant="h3">Chats de mascotas</PetText>
          <PetText variant="caption">{pets.length} conversaciones activas</PetText>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LottieAnimation source={loadingAnimation} size={220} loop />
        </View>
      ) : pets.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space[3], paddingHorizontal: space[8] }}>
          <LottieAnimation source={emptyAnimation} size={260} loop />
          <PetText variant="h3" align="center">Sin chats activos</PetText>
          <PetText variant="body" align="center">
            Los chats aparecen cuando registras mascotas. Los adoptantes podrán escribirte desde el detalle de cada mascota.
          </PetText>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: space[5], gap: space[3] }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateX: -16 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200, delay: index * 70 }}
            >
              <Pressable onPress={() => openChat(item)}>
                {({ pressed }) => (
                  <MotiView
                    animate={{ scale: pressed ? 0.98 : 1 }}
                    transition={{ type: 'timing', duration: 100 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: c.bgSurface,
                      borderRadius: radius.xl,
                      padding: space[4],
                      gap: space[4],
                      borderWidth: 1,
                      borderColor: pressed ? c.primary + '44' : c.border,
                      ...shadow.sm,
                    }}
                  >
                    {/* Avatar */}
                    <View
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: radius.full,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: c.primaryLight,
                      }}
                    >
                      {item.photoUrl ? (
                        <Image
                          source={{ uri: item.photoUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: c.primaryLight,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MaterialCommunityIcons name="paw" size={26} color={c.primary} />
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: c.textPrimary }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: fontSize.sm, color: c.textMuted }}>
                        {item.breed}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[1], marginTop: 2 }}>
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: radius.full,
                            backgroundColor: c.secondary,
                          }}
                        />
                        <Text style={{ fontSize: 11, fontWeight: fontWeight.semibold, color: c.secondary }}>
                          Chat activo
                        </Text>
                      </View>
                    </View>

                    <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
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
