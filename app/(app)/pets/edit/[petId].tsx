import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Image, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { usePets } from '@features/pets/presentation/hooks/usePets';
import { petRepository } from '../../../../src/di/container';
import { Pet, PetSize, PetStatus } from '@features/pets/domain/entities/Pet';
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetButton, PetInput, PetText,
} from '@shared/design';

const SIZES: { value: PetSize; label: string; emoji: string }[] = [
  { value: 'small',  label: 'Pequeño', emoji: '🐭' },
  { value: 'medium', label: 'Mediano', emoji: '🐶' },
  { value: 'large',  label: 'Grande',  emoji: '🐕' },
];

export default function EditPetScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updatePet } = usePets();

  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const STATUSES = [
    { value: 'available' as PetStatus, label: 'Disponible', bg: isDark ? '#052E1C' : '#D1FAE5', text: isDark ? '#4ADE80' : '#065F46', border: isDark ? '#065F46' : '#A7F3D0' },
    { value: 'pending'   as PetStatus, label: 'En proceso', bg: isDark ? '#1C1206' : '#FEF3C7', text: isDark ? '#FBBF24' : '#92400E', border: isDark ? '#78350F' : '#FDE68A' },
    { value: 'adopted'   as PetStatus, label: 'Adoptado',   bg: isDark ? '#0C1B2E' : '#EFF6FF', text: isDark ? '#60A5FA' : '#1E40AF', border: isDark ? '#1E3A5F' : '#BFDBFE' },
  ];

  const [pet, setPet] = useState<Pet | null>(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [size, setSize] = useState<PetSize>('medium');
  const [status, setStatus] = useState<PetStatus>('available');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (petId) {
      petRepository.getPetById(petId).then((p) => {
        setPet(p);
        setName(p.name);
        setBreed(p.breed);
        setAge(String(p.age));
        setSize(p.size);
        setStatus(p.status);
        setDescription(p.description);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [petId]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !petId) return;
    setSaving(true);
    try {
      await updatePet({
        id: petId, name: name.trim(), breed: breed.trim(),
        age: parseInt(age) || 0, size, status,
        description: description.trim(),
        photoUri: photoUri ?? undefined,
        photoBase64: photoBase64 ?? undefined,
      });
      Alert.alert('¡Actualizado!', 'La información fue guardada', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bgPage, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={c.primary} />
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
          <View
            style={{
              width: 38, height: 38, borderRadius: radius.full,
              backgroundColor: c.bgSubtle, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: c.border,
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={c.textPrimary} />
          </View>
        </Pressable>
        <PetText variant="h3">Editar mascota</PetText>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space[5], gap: space[4], paddingBottom: space[12] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <Pressable onPress={handlePickPhoto}>
          {({ pressed }) => (
            <MotiView
              animate={{ opacity: pressed ? 0.85 : 1 }}
              style={{
                height: 180,
                borderRadius: radius.xl,
                backgroundColor: c.primaryLight,
                borderWidth: 2,
                borderColor: (photoUri || pet?.photoUrl) ? c.primary : c.border,
                borderStyle: (photoUri || pet?.photoUrl) ? 'solid' : 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : pet?.photoUrl ? (
                <Image source={{ uri: pet.photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: 'center', gap: space[2] }}>
                  <MaterialCommunityIcons name="camera-plus" size={30} color={c.primary} />
                  <Text style={{ fontSize: fontSize.sm, color: c.primary, fontWeight: fontWeight.semibold }}>
                    Cambiar foto
                  </Text>
                </View>
              )}
            </MotiView>
          )}
        </Pressable>

        {/* Fields */}
        <View style={{ gap: space[3] }}>
          <PetInput label="Nombre" value={name} onChangeText={setName}
            leftIcon={<MaterialCommunityIcons name="paw" size={20} color={c.textMuted} />} />
          <PetInput label="Raza" value={breed} onChangeText={setBreed}
            leftIcon={<MaterialCommunityIcons name="dog" size={20} color={c.textMuted} />} />
          <PetInput label="Edad (años)" value={age} onChangeText={setAge} keyboardType="numeric"
            leftIcon={<MaterialCommunityIcons name="calendar-outline" size={20} color={c.textMuted} />} />
        </View>

        {/* Size */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: fontWeight.semibold, color: c.textSecondary, marginBottom: space[3], letterSpacing: 0.3 }}>
            Tamaño
          </Text>
          <View style={{ flexDirection: 'row', gap: space[3] }}>
            {SIZES.map((s) => {
              const active = size === s.value;
              return (
                <Pressable key={s.value} onPress={() => setSize(s.value)} style={{ flex: 1 }}>
                  <MotiView
                    animate={{ backgroundColor: active ? c.primaryLight : c.bgSurface, borderColor: active ? c.primary : c.border }}
                    transition={{ type: 'timing', duration: 160 }}
                    style={{ borderWidth: 1.5, borderRadius: radius.lg, paddingVertical: space[3], alignItems: 'center', gap: space[1] }}
                  >
                    <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: active ? c.primary : c.textSecondary }}>
                      {s.label}
                    </Text>
                  </MotiView>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Status */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: fontWeight.semibold, color: c.textSecondary, marginBottom: space[3], letterSpacing: 0.3 }}>
            Estado
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
            {STATUSES.map((s) => {
              const active = status === s.value;
              return (
                <Pressable key={s.value} onPress={() => setStatus(s.value)}>
                  <MotiView
                    animate={{ backgroundColor: active ? s.bg : c.bgSurface, borderColor: active ? s.border : c.border }}
                    transition={{ type: 'timing', duration: 160 }}
                    style={{ paddingHorizontal: space[4], paddingVertical: space[2], borderRadius: radius.full, borderWidth: 1.5 }}
                  >
                    <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: active ? s.text : c.textMuted }}>
                      {s.label}
                    </Text>
                  </MotiView>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: fontWeight.semibold, color: c.textSecondary, marginBottom: space[2], letterSpacing: 0.3 }}>
            Descripción
          </Text>
          <View style={{ borderWidth: 1.5, borderRadius: radius.lg, borderColor: c.border, backgroundColor: c.bgSurface, padding: space[4], minHeight: 110 }}>
            <TextInput
              value={description} onChangeText={setDescription} multiline numberOfLines={4}
              style={{ fontSize: fontSize.base, color: c.textPrimary, lineHeight: 22, textAlignVertical: 'top' }}
            />
          </View>
        </View>

        <PetButton label="Guardar cambios" onPress={handleSave} loading={saving}
          icon={<MaterialCommunityIcons name="content-save" size={18} color="#fff" />} />
      </ScrollView>
    </View>
  );
}
