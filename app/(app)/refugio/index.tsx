import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { getUserInitials } from '@features/auth/domain/entities/User';
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetDrawer,
} from '@shared/design';

const MENU_ITEMS = [
  {
    icon: 'paw',
    label: 'Mis Mascotas',
    desc: 'Gestiona tus animales',
    route: '/(app)/pets',
    accent: '#FF5533',
    lightBg: '#FFF1EF',
    darkBg: '#3D1209',
  },
  {
    icon: 'chat-processing',
    label: 'Mis Chats',
    desc: 'Mensajes recibidos',
    route: '/(app)/chats',
    accent: '#1FA896',
    lightBg: '#EFFAF8',
    darkBg: '#07312B',
  },
  {
    icon: 'clipboard-list',
    label: 'Solicitudes',
    desc: 'Revisa pedidos de adopción',
    route: '/(app)/adoptions',
    accent: '#F59E0B',
    lightBg: '#FEF3C7',
    darkBg: '#1C1206',
  },
  {
    icon: 'map-marker-radius',
    label: 'Mapa',
    desc: 'Tu ubicación en el mapa',
    route: '/(app)/map',
    accent: '#3B82F6',
    lightBg: '#EFF6FF',
    darkBg: '#0C1B2E',
  },
  {
    icon: 'robot',
    label: 'Asistente IA',
    desc: 'Consulta con inteligencia artificial',
    route: '/(app)/ai-chat',
    accent: '#8B5CF6',
    lightBg: '#F5F3FF',
    darkBg: '#1A1230',
  },
];

export default function RefugioDashboard() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  const drawerMenuItems = MENU_ITEMS.map((m) => ({
    icon: m.icon,
    label: m.label,
    route: m.route,
    color: m.accent,
  }));

  const QUICK_STATS = [
    { icon: 'paw',              label: 'Mascotas',   color: '#FF5533', bg: isDark ? '#3D1209' : '#FFF1EF' },
    { icon: 'chat-processing',  label: 'Chats',      color: '#1FA896', bg: isDark ? '#07312B' : '#EFFAF8' },
    { icon: 'heart-multiple',   label: 'Adopciones', color: '#F59E0B', bg: isDark ? '#1C1206' : '#FEF3C7' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style="light" />

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: c.secondary,
          paddingTop: insets.top,
          paddingHorizontal: space[5],
          paddingBottom: space[5],
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: 'absolute', right: -40, top: -40,
            width: 180, height: 180, borderRadius: 90,
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        />
        <View
          style={{
            position: 'absolute', right: 90, bottom: -30,
            width: 110, height: 110, borderRadius: 55,
            backgroundColor: 'rgba(255,255,255,0.07)',
          }}
        />
        <View
          style={{
            position: 'absolute', left: -25, bottom: 5,
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Greeting row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingTop: space[4],
          }}
        >
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: fontSize.sm }}>
              Panel de refugio
            </Text>
            <Text
              style={{
                color: '#fff',
                fontSize: fontSize.xl,
                fontWeight: fontWeight.bold,
                marginTop: 2,
              }}
            >
              Hola, {user?.username}
            </Text>
            <View
              style={{
                marginTop: space[2],
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderRadius: radius.full,
                paddingHorizontal: space[2],
                paddingVertical: 3,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <Text style={{ color: '#fff', fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                🏠 Refugio
              </Text>
            </View>
          </View>

          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
            <View
              style={{
                width: 42, height: 42, borderRadius: radius.full,
                backgroundColor: 'rgba(255,255,255,0.22)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <MaterialCommunityIcons name="menu" size={22} color="#fff" />
            </View>
          </Pressable>
        </View>

        {/* Quick stat tiles */}
        <View style={{ flexDirection: 'row', gap: space[2], marginTop: space[4] }}>
          {QUICK_STATS.map((st) => (
            <View
              key={st.label}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius: radius.lg,
                paddingVertical: space[3],
                alignItems: 'center',
                gap: 4,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <MaterialCommunityIcons name={st.icon as any} size={18} color="rgba(255,255,255,0.9)" />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: fontWeight.medium }}>
                {st.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Section label ────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: space[5],
          paddingTop: space[5],
          paddingBottom: space[3],
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[2],
        }}
      >
        <View
          style={{
            width: 4, height: 20, borderRadius: 2,
            backgroundColor: c.secondary,
          }}
        />
        <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.textPrimary }}>
          Accesos rápidos
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: c.textMuted, marginLeft: 2 }}>
          · {MENU_ITEMS.length} secciones
        </Text>
      </View>

      {/* ── Split-design dashboard cards ─────────────────────────────── */}
      <FlatList
        data={MENU_ITEMS}
        keyExtractor={(i) => i.label}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: space[4], paddingBottom: 40, gap: space[3] }}
        columnWrapperStyle={{ gap: space[3] }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 22, scale: 0.92 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200, delay: index * 80 }}
            style={{ flex: 1 }}
          >
            <Pressable onPress={() => router.push(item.route as any)}>
              {({ pressed }) => (
                <MotiView
                  animate={{ scale: pressed ? 0.96 : 1 }}
                  transition={{ type: 'timing', duration: 100 }}
                  style={{
                    backgroundColor: c.bgSurface,
                    borderRadius: radius.xl,
                    overflow: 'hidden',
                    borderWidth: 1.5,
                    borderColor: pressed ? item.accent + '66' : item.accent + '25',
                    ...shadow.md,
                  }}
                >
                  {/* Colored top zone */}
                  <View
                    style={{
                      backgroundColor: isDark ? item.darkBg : item.lightBg,
                      paddingVertical: space[5],
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderBottomColor: item.accent + '20',
                    }}
                  >
                    <View
                      style={{
                        width: 60, height: 60,
                        borderRadius: radius.full,
                        backgroundColor: item.accent + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2.5,
                        borderColor: item.accent + '45',
                        ...shadow.sm,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={28}
                        color={item.accent}
                      />
                    </View>
                  </View>

                  {/* Bottom info zone */}
                  <View
                    style={{
                      padding: space[3],
                      paddingRight: space[2],
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space[2],
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: fontSize.sm,
                          fontWeight: fontWeight.bold,
                          color: c.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {item.desc}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 24, height: 24,
                        borderRadius: radius.full,
                        backgroundColor: item.accent + '18',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <MaterialCommunityIcons name="arrow-right" size={13} color={item.accent} />
                    </View>
                  </View>
                </MotiView>
              )}
            </Pressable>
          </MotiView>
        )}
      />

      {/* ── Drawer ───────────────────────────────────────────────────── */}
      <PetDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        username={user?.username}
        email={user?.email}
        initials={user ? getUserInitials(user) : '?'}
        roleLabel="🏠 Refugio"
        roleColor={c.secondary}
        menuItems={drawerMenuItems}
        onNavigate={(route) => router.push(route as any)}
        onLogout={logout}
      />
    </View>
  );
}
