import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, Platform, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@shared/infrastructure/supabase/client';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';

const AuraBackground = () => (
  <View style={StyleSheet.absoluteFillObject}>
    <View style={styles.aura1} />
    <View style={styles.aura2} />
    <BlurView 
      intensity={100} 
      tint="dark" 
      style={StyleSheet.absoluteFillObject} 
    />
  </View>
);

export default function ProductDetailScreen() {
  const { roomId, name } = useLocalSearchParams<{ roomId: string; name?: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSeller = user?.role === 'seller';
  const insets = useSafeAreaInsets();
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchProductImage();
    }
  }, [roomId]);

  const fetchProductImage = async () => {
    try {
      setLoading(true);
      const fileName = `${roomId}/product-image.jpg`;
      
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      if (data?.publicUrl) {
        const res = await fetch(data.publicUrl, { method: 'HEAD' });
        if (res.status === 200) {
          setImageUri(data.publicUrl + '?t=' + new Date().getTime());
        } else {
          setImageUri(null);
        }
      }
    } catch (e) {
      setImageUri(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (!isSeller) {
      Alert.alert('Acceso Restringido', 'Solo el vendedor del producto puede modificar la imagen.');
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Necesitamos permisos para acceder a tu galería y subir la imagen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const asset = result.assets[0];
        uploadImage(asset.uri, asset.base64 || null);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Ocurrió un error al seleccionar la imagen: ' + e.message);
    }
  };

  const uploadImage = async (uri: string, base64Data: string | null) => {
    if (!isSeller) return;
    try {
      setUploading(true);
      const fileName = `${roomId}/product-image.jpg`;
      console.log('[Upload] Iniciando proceso de subida. URI local:', uri);
      console.log('[Upload] ¿Base64 disponible directamente?:', !!base64Data);

      let uploadPayload: ArrayBuffer | Blob;

      if (base64Data) {
        console.log('[Upload] Decodificando base64 a ArrayBuffer usando atob...');
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        uploadPayload = bytes.buffer;
        console.log('[Upload] Conversión exitosa. Tamaño decodificado:', bytes.byteLength, 'bytes');
      } else {
        console.log('[Upload] Fallback: Convirtiendo URI a Blob usando XMLHttpRequest...');
        const blob: Blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response);
          };
          xhr.onerror = function (e) {
            console.error('[Upload] Error en XMLHttpRequest:', e);
            reject(new TypeError('Fallo de red al leer el archivo local (XMLHttpRequest failed)'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });
        uploadPayload = blob;
        console.log('[Upload] Conversión fallback a Blob exitosa. Tamaño:', blob.size, 'bytes');
      }

      console.log('[Upload] Enviando binario a Supabase Storage...');
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, uploadPayload, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('[Upload] Error devuelto por el servidor de Supabase:', error);
        throw error;
      }

      console.log('[Upload] Subida a Supabase completada con éxito. Datos:', data);

      Alert.alert('Éxito', '¡La imagen del producto ha sido cargada exitosamente!');
      fetchProductImage();
    } catch (e: any) {
      console.error('[Upload] Excepción capturada en uploadImage:', e);
      Alert.alert(
        'Error de subida',
        'No se pudo guardar la imagen en Supabase Storage.\n\nDetalle: ' + (e.message || JSON.stringify(e))
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AuraBackground />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 110, 130) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Detalles del Producto</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Large Product Image Area */}
        <View style={styles.imageSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
          ) : imageUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.productImage} />
              {isSeller && (
                <TouchableOpacity style={styles.editImageBadge} onPress={handlePickImage} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="pencil" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          ) : isSeller ? (
            <TouchableOpacity style={styles.uploadPlaceholder} onPress={handlePickImage} activeOpacity={0.8}>
              <MaterialCommunityIcons name="camera-plus" size={48} color="#94a3b8" />
              <Text style={styles.uploadText}>Sube la imagen del producto</Text>
              <Text style={styles.uploadSubtext}>JPG o PNG (Límite 5MB)</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <MaterialCommunityIcons name="image-off" size={48} color="#94a3b8" />
              <Text style={styles.uploadText}>Sin imagen disponible</Text>
              <Text style={styles.uploadSubtext}>El vendedor aún no ha cargado una foto.</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.uploadOverlayText}>Subiendo a Supabase Storage...</Text>
            </View>
          )}
        </View>

        {/* Sliding Curved Glass Panel */}
        <View style={styles.slidingPanel}>
          <Text style={styles.productName}>{name || 'Cargando producto...'}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Precio de Venta</Text>
            <Text style={styles.priceValue}>$1,299.00 USD</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Estado</Text>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>En Stock</Text>
              </View>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>SKU</Text>
              <Text style={styles.metaValue}>NEX-8492-CH</Text>
            </View>
          </View>

          <Text style={styles.detailsTitle}>Descripción del Producto</Text>
          <Text style={styles.detailsDescription}>
            Canal exclusivo para soporte de este producto de alta gama. Incluye asesoramiento directo en tiempo real, manuales técnicos de resolución y garantía extendida Aethera®.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) at the bottom */}
      <View style={[styles.bottomFabContainer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <TouchableOpacity
          style={styles.chatButton}
          activeOpacity={0.8}
          onPress={() => router.push({
            pathname: '/(app)/chat/[roomId]',
            params: { roomId, name }
          })}
        >
          <MaterialCommunityIcons name="chat-processing" size={22} color="#ffffff" />
          <Text style={styles.chatButtonText}>Ingresar al Chat de Soporte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16', // Deep Midnight Slate background
  },
  aura1: {
    position: 'absolute',
    top: '-25%',
    left: '-35%',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(79, 70, 229, 0.22)', // soft out-of-focus indigo glow
  },
  aura2: {
    position: 'absolute',
    bottom: '10%',
    right: '-40%',
    width: 650,
    height: 650,
    borderRadius: 325,
    backgroundColor: 'rgba(192, 38, 211, 0.15)', // soft out-of-focus fuchsia glow
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderBottomWidth: 1.2,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  imageSection: {
    width: '100%',
    height: 280,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadPlaceholder: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  uploadSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  loader: {
    transform: [{ scale: 1.2 }],
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadOverlayText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  slidingPanel: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: 'rgba(22, 32, 51, 0.9)', // Opaque frosted glass sliding panel
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  priceValue: {
    color: '#60a5fa',
    fontSize: 22,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  metaValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeSuccessText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    fontWeight: '400',
  },
  bottomFabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1', // glowing FAB
    borderRadius: 16,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
