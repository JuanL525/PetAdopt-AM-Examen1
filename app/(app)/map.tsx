import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { useShelterMap } from '@features/map/presentation/hooks/useShelterMap';
import { useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize } from '@shared/design';

function buildLeafletHTML(
  userLat: number | null,
  userLng: number | null,
  shelters: { lat: number; lng: number; name: string }[],
  enableTap: boolean,
  selected: { lat: number; lng: number } | null,
): string {
  const shelterMarkers = shelters.map((s) =>
    `L.marker([${s.lat}, ${s.lng}], {icon: shelterIcon})
      .addTo(map)
      .bindPopup('<b>🏠 ${s.name}</b><br>Refugio registrado');`
  ).join('\n');

  const userMarker = userLat != null && userLng != null
    ? `L.marker([${userLat}, ${userLng}], {icon: userIcon}).addTo(map).bindPopup('<b>📍 Tu ubicación</b>');`
    : '';

  const selectedMarker = selected != null
    ? `selectedMarker = L.marker([${selected.lat}, ${selected.lng}], {icon: selectedIcon}).addTo(map).bindPopup('<b>📌 Ubicación elegida</b>');`
    : '';

  const allPoints = [
    ...shelters.map((s) => `[${s.lat}, ${s.lng}]`),
    ...(userLat != null && userLng != null ? [`[${userLat}, ${userLng}]`] : []),
    ...(selected != null ? [`[${selected.lat}, ${selected.lng}]`] : []),
  ];

  const center = userLat != null && userLng != null
    ? `[${userLat}, ${userLng}]`
    : shelters.length > 0 ? `[${shelters[0].lat}, ${shelters[0].lng}]` : '[-0.1807, -78.4678]';

  const fitBounds = allPoints.length > 1
    ? `map.fitBounds([${allPoints.join(',')}], { padding: [50, 50], maxZoom: 15 });`
    : '';

  const tapScript = enableTap
    ? `map.on('click', function(e) {
        if (selectedMarker) { map.removeLayer(selectedMarker); }
        selectedMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: selectedIcon})
          .addTo(map).bindPopup('<b>📌 Ubicación elegida</b>').openPopup();
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
      });`
    : '';

  const primaryColor = '#FF5533';
  const secondaryColor = '#1FA896';

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #FAFAF8; }
  #map { width: 100vw; height: 100vh; }
  .leaflet-popup-content-wrapper { border-radius: 12px; font-family: -apple-system, sans-serif; }
</style>
</head><body>
<div id="map"></div>
<script>
  var selectedMarker = null;
  var map = L.map('map').setView(${center}, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  var shelterIcon = L.divIcon({
    html: '<div style="background:${secondaryColor};width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.25)">🏠</div>',
    iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22], className: ''
  });

  var userIcon = L.divIcon({
    html: '<div style="background:${primaryColor};width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.25)">📍</div>',
    iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22], className: ''
  });

  var selectedIcon = L.divIcon({
    html: '<div style="background:#F59E0B;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.25)">📌</div>',
    iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22], className: ''
  });

  ${shelterMarkers}
  ${userMarker}
  ${selectedMarker}
  ${fitBounds}
  ${tapScript}
</script>
</body></html>`;
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { shelters, isLoading, loadShelters, saveMyLocation } = useShelterMap();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isRefugio = user?.role === 'refugio';
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    loadShelters();
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
      if (pos) setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      console.warn('[Map] Location error:', e);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    const loc = selectedLocation ?? userLocation;
    if (!loc) {
      Alert.alert('Elige una ubicación', 'Toca un punto en el mapa para marcar tu refugio, o usa el GPS.');
      return;
    }
    setSaving(true);
    try {
      await saveMyLocation(loc.lat, loc.lng);
      Alert.alert('¡Listo!', 'La ubicación de tu refugio fue guardada.');
      setSelectedLocation(null);
      loadShelters();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const shelterMarkers = shelters.map((s) => ({ lat: s.latitude, lng: s.longitude, name: s.shelterName }));
  const html = buildLeafletHTML(
    userLocation?.lat ?? null,
    userLocation?.lng ?? null,
    shelterMarkers,
    isRefugio,
    selectedLocation,
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header overlay */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space[5],
          paddingTop: insets.top + space[3],
          paddingBottom: space[4],
          backgroundColor: 'rgba(250,250,248,0.95)',
          borderBottomWidth: 1,
          borderBottomColor: c.border,
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
          <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: c.textPrimary }}>
            Refugios Cercanos
          </Text>
          <Text style={{ fontSize: fontSize.xs, color: c.textMuted }}>
            {shelters.length} refugios registrados
          </Text>
        </View>

        <Pressable onPress={requestLocation} disabled={locationLoading} hitSlop={8}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.full,
              backgroundColor: c.secondaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: c.secondary + '44',
            }}
          >
            {locationLoading
              ? <ActivityIndicator size="small" color={c.secondary} />
              : <MaterialCommunityIcons name="crosshairs-gps" size={20} color={c.secondary} />
            }
          </View>
        </Pressable>
      </View>

      {/* Map */}
      <WebView
        key={html.length + (userLocation ? 'u' : '') + (selectedLocation ? 's' : '') + shelters.length}
        source={{ html }}
        style={{ flex: 1 }}
        javaScriptEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (typeof data.lat === 'number' && typeof data.lng === 'number') {
              setSelectedLocation({ lat: data.lat, lng: data.lng });
            }
          } catch {}
        }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            justifyContent: 'center',
            alignItems: 'center',
            gap: space[3],
            backgroundColor: 'rgba(250,250,248,0.75)',
          }}
          pointerEvents="none"
        >
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={{ fontSize: fontSize.sm, color: c.textMuted }}>Cargando refugios...</Text>
        </View>
      )}

      {/* Refugio hint */}
      {isRefugio && (
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 500 }}
          style={{
            position: 'absolute',
            top: insets.top + 72,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[2],
            backgroundColor: '#FFFBEB',
            paddingHorizontal: space[4],
            paddingVertical: space[2],
            borderRadius: radius.full,
            borderWidth: 1,
            borderColor: '#FDE68A',
            ...shadow.sm,
          }}
          pointerEvents="none"
        >
          <MaterialCommunityIcons name="gesture-tap" size={16} color={c.warning} />
          <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.warning }}>
            Toca el mapa para marcar tu refugio
          </Text>
        </MotiView>
      )}

      {/* Bottom legend */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(250,250,248,0.97)',
          padding: space[5],
          paddingBottom: insets.bottom + space[5],
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: space[4],
          borderTopWidth: 1,
          borderTopColor: c.border,
          ...shadow.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          <Text style={{ fontSize: 18 }}>🏠</Text>
          <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.textSecondary }}>
            Refugios ({shelters.length})
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          <Text style={{ fontSize: 18 }}>📍</Text>
          <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.textSecondary }}>
            Tú
          </Text>
        </View>

        {isRefugio && (
          <Pressable onPress={handleSaveLocation} disabled={saving} style={{ marginLeft: 'auto' }}>
            <MotiView
              animate={{ opacity: saving ? 0.6 : 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[2],
                backgroundColor: c.secondary,
                paddingHorizontal: space[4],
                paddingVertical: space[2],
                borderRadius: radius.lg,
                ...shadow.sm,
              }}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <MaterialCommunityIcons name="map-marker-plus" size={16} color="#fff" />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#fff' }}>
                      Guardar mi refugio
                    </Text>
                  </>
              }
            </MotiView>
          </Pressable>
        )}
      </View>
    </View>
  );
}
