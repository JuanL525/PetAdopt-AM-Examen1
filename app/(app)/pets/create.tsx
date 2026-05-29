import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Image, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { usePets } from '@features/pets/presentation/hooks/usePets';
import { PetSize, AgeUnit, encodePetAge } from '@features/pets/domain/entities/Pet';
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetButton, PetInput, PetText,
} from '@shared/design';

const SIZES: { value: PetSize; label: string; emoji: string }[] = [
  { value: 'small',  label: 'Pequeño',  emoji: '🐭' },
  { value: 'medium', label: 'Mediano',  emoji: '🐶' },
  { value: 'large',  label: 'Grande',   emoji: '🐕' },
];

export default function CreatePetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createPet } = usePets();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('years');
  const [size, setSize] = useState<PetSize>('medium');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleAgeUnitChange = (unit: AgeUnit) => {
    setAgeUnit(unit);
    setAge('');
  };

  const handleAgeChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (!digits) {
      setAge('');
      return;
    }
    const max = ageUnit === 'months' ? 12 : 20;
    const num = Math.min(parseInt(digits, 10), max);
    setAge(String(num));
  };

  const handleSave = async () => {
    if (!photoUri || !photoBase64) {
      Alert.alert('Foto requerida', 'Debes añadir una foto de la mascota para continuar');
      return;
    }
    if (!name.trim() || !breed.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y raza son obligatorios');
      return;
    }
    if (/\d/.test(breed)) {
      Alert.alert('Raza inválida', 'La raza no puede contener números');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1) {
      Alert.alert('Edad requerida', `Indica la edad en ${ageUnit === 'months' ? 'meses' : 'años'}`);
      return;
    }
    const maxAge = ageUnit === 'months' ? 12 : 20;
    if (ageNum > maxAge) {
      Alert.alert(
        'Edad inválida',
        ageUnit === 'months'
          ? 'La edad en meses no puede ser mayor a 12'
          : 'La edad en años no puede ser mayor a 20',
      );
      return;
    }
    setSaving(true);
    try {
      await createPet({
        name: name.trim(),
        breed: breed.trim(),
        age: encodePetAge(ageNum, ageUnit),
        size,
        description: description.trim(),
        photoUri,
        photoBase64,
      });
      Alert.alert('¡Listo!', `${name} fue registrada exitosamente`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
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
        <PetText variant="h3">Nueva mascota</PetText>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space[5], gap: space[4], paddingBottom: space[12] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo picker */}
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 80 }}
        >
          <Pressable onPress={handlePickPhoto}>
            {({ pressed }) => (
              <MotiView
                animate={{ opacity: pressed ? 0.85 : 1 }}
                style={{
                  height: 200,
                  borderRadius: radius.xl,
                  backgroundColor: c.primaryLight,
                  borderWidth: 2,
                  borderColor: photoUri ? c.primary : c.border,
                  borderStyle: photoUri ? 'solid' : 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center', gap: space[2] }}>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: radius.full,
                        backgroundColor: c.bgSurface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...shadow.sm,
                      }}
                    >
                      <MaterialCommunityIcons name="camera-plus" size={30} color={c.primary} />
                    </View>
                    <Text style={{ fontSize: fontSize.sm, color: c.primary, fontWeight: fontWeight.semibold }}>
                      Añadir foto *
                    </Text>
                    <Text style={{ fontSize: fontSize.xs, color: c.textMuted }}>
                      Obligatorio · toca para seleccionar de tu galería
                    </Text>
                  </View>
                )}
              </MotiView>
            )}
          </Pressable>
        </MotiView>

        {/* Fields */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 160 }}
          style={{ gap: space[3] }}
        >
          <PetInput
            label="Nombre *"
            value={name}
            onChangeText={setName}
            placeholder="Ej: Luna"
            leftIcon={<MaterialCommunityIcons name="paw" size={20} color={c.textMuted} />}
          />

          <PetInput
            label="Raza *"
            value={breed}
            onChangeText={(text) => setBreed(text.replace(/\d/g, ''))}
            placeholder="Ej: Labrador"
            leftIcon={<MaterialCommunityIcons name="dog" size={20} color={c.textMuted} />}
          />

          {/* Age unit toggle */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: fontWeight.semibold, color: c.textSecondary, marginBottom: space[2], letterSpacing: 0.3 }}>
              Edad *
            </Text>
            <View style={{ flexDirection: 'row', gap: space[2], marginBottom: space[3] }}>
              {(['months', 'years'] as AgeUnit[]).map((unit) => {
                const active = ageUnit === unit;
                return (
                  <Pressable key={unit} onPress={() => handleAgeUnitChange(unit)} style={{ flex: 1 }}>
                    <MotiView
                      animate={{
                        backgroundColor: active ? c.primaryLight : c.bgSurface,
                        borderColor: active ? c.primary : c.border,
                      }}
                      transition={{ type: 'timing', duration: 160 }}
                      style={{
                        borderWidth: 1.5,
                        borderRadius: radius.lg,
                        paddingVertical: space[2],
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: fontSize.sm,
                          fontWeight: fontWeight.semibold,
                          color: active ? c.primary : c.textSecondary,
                        }}
                      >
                        {unit === 'months' ? 'Meses' : 'Años'}
                      </Text>
                    </MotiView>
                  </Pressable>
                );
              })}
            </View>
            <PetInput
              label={ageUnit === 'months' ? 'Meses (máx. 12)' : 'Años (máx. 20)'}
              value={age}
              onChangeText={handleAgeChange}
              placeholder={ageUnit === 'months' ? 'Ej: 6' : 'Ej: 2'}
              keyboardType="numeric"
              leftIcon={<MaterialCommunityIcons name="calendar-outline" size={20} color={c.textMuted} />}
            />
          </View>
        </MotiView>

        {/* Size selector */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 240 }}
        >
          <Text style={{ fontSize: 12, fontWeight: fontWeight.semibold, color: c.textSecondary, marginBottom: space[3], letterSpacing: 0.3 }}>
            Tamaño
          </Text>
          <View style={{ flexDirection: 'row', gap: space[3] }}>
            {SIZES.map((s) => {
              const active = size === s.value;
              return (
                <Pressable key={s.value} onPress={() => setSize(s.value)} style={{ flex: 1 }}>
                  <MotiView
                    animate={{
                      backgroundColor: active ? c.primaryLight : c.bgSurface,
                      borderColor: active ? c.primary : c.border,
                    }}
                    transition={{ type: 'timing', duration: 160 }}
                    style={{
                      borderWidth: 1.5,
                      borderRadius: radius.lg,
                      paddingVertical: space[3],
                      alignItems: 'center',
                      gap: space[1],
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                    <Text
                      style={{
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.semibold,
                        color: active ? c.primary : c.textSecondary,
                      }}
                    >
                      {s.label}
                    </Text>
                  </MotiView>
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {/* Description */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 320 }}
        >
          <Text style={{ fontSize: 12, fontWeight: fontWeight.semibold, color: c.textSecondary, marginBottom: space[2], letterSpacing: 0.3 }}>
            Descripción (opcional)
          </Text>
          <MotiView
            animate={{ borderColor: c.border }}
            style={{
              borderWidth: 1.5,
              borderRadius: radius.lg,
              backgroundColor: c.bgSurface,
              padding: space[4],
              minHeight: 110,
            }}
          >
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Cuéntanos sobre la personalidad y necesidades de la mascota..."
              placeholderTextColor={c.textMuted}
              multiline
              numberOfLines={4}
              style={{ fontSize: fontSize.base, color: c.textPrimary, lineHeight: 22, textAlignVertical: 'top' }}
            />
          </MotiView>
        </MotiView>

        {/* Submit */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 400 }}
        >
          <PetButton
            label="Guardar mascota"
            onPress={handleSave}
            loading={saving}
            icon={<MaterialCommunityIcons name="content-save" size={18} color="#fff" />}
          />
        </MotiView>
      </ScrollView>
    </View>
  );
}
