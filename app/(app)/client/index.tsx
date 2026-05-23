import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { useRooms } from '@features/chat/presentation/hooks/useRooms';
import { Room } from '@features/chat/domain/entities/Room';
import { getUserInitials } from '@features/auth/domain/entities/User';
import { BlurView } from 'expo-blur';

const auraColors = [
  { text: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', iconBg: 'rgba(52, 211, 153, 0.12)' },
  { text: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', iconBg: 'rgba(96, 165, 250, 0.12)' },
  { text: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', iconBg: 'rgba(251, 191, 36, 0.12)' },
  { text: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', iconBg: 'rgba(248, 113, 113, 0.12)' },
  { text: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', iconBg: 'rgba(192, 132, 252, 0.12)' },
  { text: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)', iconBg: 'rgba(244, 114, 182, 0.12)' }
];

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

export default function ClientHome() {
  const user   = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const router = useRouter();
  const { rooms, isLoading, loadRooms } = useRooms();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const renderRoom = ({ item, index }: { item: Room; index: number }) => {
    const colorPack = auraColors[index % auraColors.length];
    return (
      <TouchableOpacity
        style={[styles.roomCard, { borderLeftColor: colorPack.text }]}
        activeOpacity={0.8}
        onPress={() => router.push({
          pathname: '/(app)/product/[roomId]',
          params: { roomId: item.id, name: item.name }
        })}
      >
        <View style={[styles.roomIcon, { backgroundColor: colorPack.iconBg }]}>
          <Text style={[styles.roomIconText, { color: colorPack.text }]}>#</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomMeta}>Toca para preguntar sobre este producto</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AuraBackground />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>👤 Cliente</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>¿Sobre qué producto quieres preguntar?</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#34d399" />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(r) => r.id}
          renderItem={({ item, index }) => renderRoom({ item, index })}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Aún no hay salas disponibles.{"\n"}Vuelve pronto.
            </Text>
          }
        />
      )}

      {/* Sidebar Drawer */}
      {menuOpen && (
        <View style={StyleSheet.absoluteFill}>
          {/* Overlay background */}
          <TouchableOpacity
            style={styles.drawerOverlay}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />
          {/* Drawer Content */}
          <View style={styles.drawerContainer}>
            {/* Header */}
            <View style={styles.drawerHeader}>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.drawerProfile}>
                <View style={[styles.drawerAvatar, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <Text style={[styles.drawerAvatarText, { color: '#34d399' }]}>
                    {user ? getUserInitials(user) : '?'}
                  </Text>
                </View>
                <Text style={styles.drawerUsername}>{user?.username}</Text>
                <Text style={styles.drawerEmail}>{user?.email}</Text>
                <View style={styles.drawerRoleBadge}>
                  <Text style={styles.drawerRoleText}>👤 Cliente</Text>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.drawerMenu}>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => Alert.alert('Aviso', 'Funcionalidad de simulación para profesionalismo')}>
                <MaterialCommunityIcons name="cog" size={20} color="#94a3b8" />
                <Text style={styles.drawerMenuText}>Configuraciones</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => Alert.alert('Acerca de', 'Nexus Chat v1.0.0\nConstruido con React Native & Clean Architecture')}>
                <MaterialCommunityIcons name="information" size={20} color="#94a3b8" />
                <Text style={styles.drawerMenuText}>Acerca de</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => Alert.alert('Aviso', 'Soporte técnico premium simulado')}>
                <MaterialCommunityIcons name="help-circle" size={20} color="#94a3b8" />
                <Text style={styles.drawerMenuText}>Soporte</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Logout */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.drawerLogoutBtn} onPress={() => { setMenuOpen(false); logout(); }}>
                <MaterialCommunityIcons name="logout" size={20} color="#f87171" />
                <Text style={styles.drawerLogoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    bottom: '5%',
    right: '-40%',
    width: 650,
    height: 650,
    borderRadius: 325,
    backgroundColor: 'rgba(192, 38, 211, 0.15)', // soft out-of-focus fuchsia glow
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.6)', // Glassy header
    borderBottomWidth: 1.2,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  greeting: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  roleBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  roleText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  menuBtn: {
    padding: 6,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    fontWeight: '600',
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 32, 51, 0.85)', // Opaque Slate Glass surface
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.09)', // bright border
    borderLeftWidth: 6, // Thick left color bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  roomIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roomIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  roomName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  roomMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
    lineHeight: 24,
  },

  // Drawer styles
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // dark frosted container
    borderRightWidth: 1.2,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  drawerHeader: {
    marginBottom: 30,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  drawerProfile: {
    alignItems: 'center',
    marginTop: 10,
  },
  drawerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  drawerAvatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  drawerUsername: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  drawerEmail: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  drawerRoleBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1.2,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  drawerRoleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34d399',
  },
  drawerMenu: {
    flex: 1,
    gap: 8,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  drawerMenuText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  drawerLogoutText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '600',
  },
});
