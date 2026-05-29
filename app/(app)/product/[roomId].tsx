import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@shared/infrastructure/supabase/client';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetButton, PetText,
} from '@shared/design';

export default function ProductDetailScreen() {
  const { roomId, name } = useLocalSearchParams<{ roomId: string; name?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isSeller = user?.role === 'refugio';
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (roomId) fetchProductImage();
  }, [roomId]);

  const fetchProductImage = async () => {
    try {
      setLoading(true);
      const fileName = `${roomId}/product-image.jpg`;
      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      if (data?.publicUrl) {
        const res = await fetch(data.publicUrl, { method: 'HEAD' });
        setImageUri(res.status === 200 ? data.publicUrl + '?t=' + Date.now() : null);
      }
    } catch {
      setImageUri(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (!isSeller) { Alert.alert('Acceso Restringido', 'Solo el vendedor puede modificar la imagen.'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true });
    if (!result.canceled && result.assets?.[0]) {
      uploadImage(result.assets[0].uri, result.assets[0].base64 || null);
    }
  };

  const uploadImage = async (uri: string, base64Data: string | null) => {
    if (!isSeller) return;
    setUploading(true);
    try {
      const fileName = `${roomId}/product-image.jpg`;
      let payload: ArrayBuffer | Blob;
      if (base64Data) {
        const bin = atob(base64Data);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        payload = bytes.buffer;
      } else {
        payload = await new Promise<Blob>((res, rej) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => res(xhr.response);
          xhr.onerror = rej;
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });
      }
      const { error } = await supabase.storage.from('products').upload(fileName, payload, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      Alert.alert('¡Éxito!', 'Imagen cargada exitosamente');
      fetchProductImage();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 110, 130) }} showsVerticalScrollIndicator={false}>
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
          <PetText variant="h3" style={{ flex: 1 }} numberOfLines={1}>Detalles del producto</PetText>
        </View>

        {/* Image area */}
        <View style={{ width: '100%', height: 280, backgroundColor: c.primaryLight, position: 'relative' }}>
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={c.primary} />
            </View>
          ) : imageUri ? (
            <View style={{ flex: 1 }}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              {isSeller && (
                <Pressable
                  onPress={handlePickImage}
                  style={{ position: 'absolute', bottom: space[3], right: space[3] }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', ...shadow.brand }}>
                    <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                  </View>
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable onPress={isSeller ? handlePickImage : undefined} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[2] }}>
              <MaterialCommunityIcons name={isSeller ? 'camera-plus' : 'image-off'} size={48} color={c.textMuted} />
              <Text style={{ fontSize: fontSize.sm, color: c.textMuted }}>
                {isSeller ? 'Sube la imagen del producto' : 'Sin imagen disponible'}
              </Text>
            </Pressable>
          )}

          {uploading && (
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(250,250,248,0.85)', alignItems: 'center', justifyContent: 'center', gap: space[3] }}>
              <ActivityIndicator size="large" color={c.primary} />
              <Text style={{ fontSize: fontSize.sm, color: c.textSecondary }}>Subiendo imagen...</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 100 }}
          style={{ padding: space[5], gap: space[4] }}
        >
          <Text style={{ fontSize: fontSize['2xl'], fontWeight: fontWeight.extrabold, color: c.textPrimary }}>
            {name || 'Producto'}
          </Text>

          <View
            style={{
              backgroundColor: c.bgSurface,
              borderRadius: radius.xl,
              padding: space[5],
              gap: space[4],
              borderWidth: 1,
              borderColor: c.border,
              ...shadow.sm,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.sm, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: fontWeight.semibold }}>
                Precio de Venta
              </Text>
              <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.extrabold, color: c.primary }}>
                $1,299.00
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: c.border }} />

            <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Descripción
            </Text>
            <Text style={{ fontSize: fontSize.base, color: c.textSecondary, lineHeight: 24 }}>
              Canal exclusivo para soporte de este producto. Incluye asesoramiento directo en tiempo real y garantía extendida.
            </Text>
          </View>
        </MotiView>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: space[5],
          paddingBottom: Math.max(insets.bottom + space[4], space[6]),
          backgroundColor: c.bgSurface,
          borderTopWidth: 1,
          borderTopColor: c.border,
          ...shadow.lg,
        }}
      >
        <PetButton
          label="Ingresar al Chat de Soporte"
          onPress={() => router.push({ pathname: '/(app)/chat/[roomId]', params: { roomId: roomId as string, name: name as string } })}
          icon={<MaterialCommunityIcons name="chat-processing" size={18} color="#fff" />}
        />
      </View>
    </View>
  );
}
