import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { usePets } from '@features/pets/presentation/hooks/usePets';
import { Pet, formatPetAge } from '@features/pets/domain/entities/Pet';
import { LottieAnimation } from '../../../components/animations/LottieAnimation';
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetBadge, PetText, PetButton,
} from '@shared/design';
const loadingAnimation = require('../../../assets/animations/loading-cat.json');
const emptyAnimation   = require('../../../assets/animations/empty-dog.json');

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = {
  available: 'success',
  pending:   'warning',
  adopted:   'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  adopted:   'Adoptado',
  pending:   'En proceso',
};

export default function PetsListScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { pets, isLoading, loadPets, deletePet } = usePets();
  const isRefugio = user?.role === 'refugio';

  useEffect(() => { loadPets(); }, [loadPets]);

  const handleDelete = (pet: Pet) => {
    Alert.alert(
      'Eliminar mascota',
      `¿Estás seguro de que deseas eliminar a ${pet.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try { await deletePet(pet.id); } catch (e: any) { Alert.alert('Error', e.message); }
          },
        },
      ]
    );
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
          <PetText variant="h3">Mascotas en adopción</PetText>
          {!isLoading && (
            <PetText variant="caption">{pets.length} registradas</PetText>
          )}
        </View>

        {isRefugio && (
          <Pressable onPress={() => router.push('/(app)/pets/create')}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.full,
                backgroundColor: c.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadow.brand,
              }}
            >
              <MaterialCommunityIcons name="plus" size={22} color="#fff" />
            </View>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LottieAnimation source={loadingAnimation} size={140} loop />
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: space[5], gap: space[3], paddingBottom: space[10] }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadPets}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: space[12], gap: space[4] }}>
              <LottieAnimation source={emptyAnimation} size={150} loop />
              <PetText variant="h3" align="center">No hay mascotas</PetText>
              {isRefugio && (
                <View style={{ width: 220 }}>
                  <PetButton
                    label="Agregar"
                    onPress={() => router.push('/(app)/pets/create')}
                    variant="primary"
                  />
                </View>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200, delay: index * 60 }}
            >
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(app)/pets/[petId]', params: { petId: item.id } })
                }
              >
                {({ pressed }) => (
                  <MotiView
                    animate={{ scale: pressed ? 0.99 : 1 }}
                    transition={{ type: 'timing', duration: 100 }}
                    style={{
                      flexDirection: 'row',
                      backgroundColor: c.bgSurface,
                      borderRadius: radius.xl,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: pressed ? c.primary + '44' : c.border,
                      ...shadow.sm,
                    }}
                  >
                    {/* Photo */}
                    <View style={{ width: 96, height: 96 }}>
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
                          <Text style={{ fontSize: 36 }}>🐾</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, padding: space[3], gap: space[1], justifyContent: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: c.textPrimary, flex: 1 }}>
                          {item.name}
                        </Text>
                        <PetBadge
                          label={STATUS_LABEL[item.status] ?? item.status}
                          variant={STATUS_VARIANT[item.status] ?? 'neutral'}
                          size="sm"
                        />
                      </View>

                      <Text style={{ fontSize: fontSize.sm, color: c.textMuted }}>
                        {item.breed} · {formatPetAge(item.age)}
                      </Text>

                      {item.description ? (
                        <Text style={{ fontSize: fontSize.xs, color: c.textMuted, lineHeight: 18 }} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}

                      {item.shelterName && (
                        <Text style={{ fontSize: 11, color: c.secondary, fontWeight: fontWeight.medium }}>
                          🏠 {item.shelterName}
                        </Text>
                      )}
                    </View>

                    {/* Actions (refugio only, own pets) */}
                    {isRefugio && item.shelterId === user?.id && (
                      <View style={{ justifyContent: 'center', paddingRight: space[3], gap: space[2] }}>
                        <Pressable
                          onPress={() =>
                            router.push({ pathname: '/(app)/pets/edit/[petId]', params: { petId: item.id } })
                          }
                          hitSlop={6}
                        >
                          <View
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: radius.md,
                              backgroundColor: '#EFF6FF',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MaterialCommunityIcons name="pencil" size={16} color={c.info} />
                          </View>
                        </Pressable>
                        <Pressable onPress={() => handleDelete(item)} hitSlop={6}>
                          <View
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: radius.md,
                              backgroundColor: '#FEF2F2',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.error} />
                          </View>
                        </Pressable>
                      </View>
                    )}
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
