import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { useChat } from '@features/chat/presentation/hooks/useChat';
import { Message } from '@features/chat/domain/entities/Message';
import { getUserInitials } from '@features/auth/domain/entities/User';
import { setActiveRoomId } from '../../../src/services/activeChatRoom';
import { useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize } from '@shared/design';

export default function ChatRoom() {
  const { roomId, name } = useLocalSearchParams<{ roomId: string; name?: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { messages, isLoading, sendMessage, subscribeToRoom } = useChat(roomId || '');
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [keyboardActive, setKeyboardActive] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardActive(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => { setKeyboardActive(false); inputRef.current?.blur(); });
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    setActiveRoomId(roomId);
    const unsubscribe = subscribeToRoom();
    return () => { setActiveRoomId(null); unsubscribe(); };
  }, [roomId, subscribeToRoom]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.author?.id === user?.id;
    const isRefugio = item.author?.role === 'refugio';
    const initials = item.author?.username ? getUserInitials({ username: item.author.username }) : '?';

    return (
      <View
        style={{
          flexDirection: isOwn ? 'row-reverse' : 'row',
          marginBottom: space[4],
          alignItems: 'flex-end',
          gap: space[2],
        }}
      >
        {/* Avatar (others only) */}
        {!isOwn && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.full,
              backgroundColor: isRefugio ? '#EFF6FF' : c.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isRefugio ? '#BFDBFE' : c.border,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: fontWeight.bold, color: isRefugio ? c.info : c.primary }}>
              {initials}
            </Text>
          </View>
        )}

        <View style={{ maxWidth: '75%' }}>
          {/* Name + role badge */}
          {!isOwn && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[1],
                marginBottom: 4,
                alignSelf: 'flex-start',
                backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.82)',
                borderRadius: radius.sm,
                paddingHorizontal: 6,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: fontWeight.bold, color: isDark ? 'rgba(255,255,255,0.9)' : c.textPrimary }}>
                {item.author?.username || 'Usuario'}
              </Text>
              <View
                style={{
                  backgroundColor: isRefugio ? (isDark ? '#1E3A5F' : '#EFF6FF') : c.primaryLight,
                  borderRadius: radius.xs,
                  paddingHorizontal: 5,
                  paddingVertical: 1.5,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: isRefugio ? c.info : c.primary }}>
                  {isRefugio ? 'Refugio' : 'Adoptante'}
                </Text>
              </View>
            </View>
          )}

          {/* Bubble */}
          <View
            style={{
              backgroundColor: isOwn ? c.primary : c.bgSurface,
              borderRadius: radius.xl,
              borderBottomRightRadius: isOwn ? radius.xs : radius.xl,
              borderBottomLeftRadius: isOwn ? radius.xl : radius.xs,
              paddingHorizontal: space[4],
              paddingVertical: space[3],
              borderWidth: isOwn ? 0 : 1,
              borderColor: c.border,
              ...(isOwn ? shadow.brand : shadow.sm),
            }}
          >
            <Text
              style={{
                fontSize: fontSize.base,
                lineHeight: 22,
                color: isOwn ? '#fff' : c.textPrimary,
              }}
            >
              {item.content}
            </Text>
            <Text
              style={{
                fontSize: 10,
                marginTop: 4,
                textAlign: isOwn ? 'right' : 'left',
                color: isOwn ? 'rgba(255,255,255,0.7)' : c.textMuted,
              }}
            >
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Wallpaper — absolute so it never resizes when keyboard opens */}
      <ImageBackground
        source={isDark
          ? require('../../../assets/images/fondo-negro.jpg')
          : require('../../../assets/images/fondo.jpg')}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="repeat"
      />
      <View
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.08)',
        }}
        pointerEvents="none"
      />

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

        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: radius.md,
            backgroundColor: c.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="paw" size={18} color={c.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.bold, color: c.textPrimary }} numberOfLines={1}>
            {name || 'Chat de adopción'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[1] }}>
            <View style={{ width: 7, height: 7, borderRadius: radius.full, backgroundColor: c.secondary }} />
            <Text style={{ fontSize: 11, color: c.secondary, fontWeight: fontWeight.semibold }}>En línea</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        enabled={Platform.OS === 'ios' ? true : keyboardActive}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Transparent message area — wallpaper shows through */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: space[5], paddingBottom: space[3], flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: space[3] }}>
                <Text style={{ fontSize: 40 }}>💬</Text>
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.88)',
                    borderRadius: radius.lg,
                    paddingHorizontal: space[4],
                    paddingVertical: space[2],
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.base,
                      color: isDark ? 'rgba(255,255,255,0.95)' : c.textPrimary,
                      fontWeight: fontWeight.semibold,
                      textAlign: 'center',
                    }}
                  >
                    Sé el primero en escribir
                  </Text>
                </View>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: space[4],
            paddingTop: space[3],
            paddingBottom: keyboardActive ? space[3] : Math.max(insets.bottom + space[3], space[5]),
            backgroundColor: c.bgSurface,
            borderTopWidth: 1,
            borderTopColor: c.border,
            gap: space[2],
            alignItems: 'flex-end',
          }}
        >
          <MotiView
            animate={{ borderColor: text.length > 0 ? c.primary : c.border }}
            transition={{ type: 'timing', duration: 150 }}
            style={{
              flex: 1,
              borderWidth: 1.5,
              borderRadius: radius.xl,
              backgroundColor: c.bgSubtle,
              paddingHorizontal: space[4],
              paddingVertical: space[2],
              maxHeight: 120,
            }}
          >
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={user?.role === 'adoptante' ? 'Escribe al refugio...' : 'Responde al adoptante...'}
              placeholderTextColor={c.textMuted}
              multiline
              maxLength={500}
              onFocus={() => setKeyboardActive(true)}
              onBlur={() => setKeyboardActive(false)}
              style={{ fontSize: fontSize.base, color: c.textPrimary, maxHeight: 100 }}
            />
          </MotiView>

          <Pressable onPress={handleSend} disabled={!text.trim()}>
            <MotiView
              animate={{ backgroundColor: text.trim() ? c.primary : c.bgSubtle }}
              transition={{ type: 'timing', duration: 180 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                ...(text.trim() ? shadow.brand : shadow.none),
              }}
            >
              <MaterialCommunityIcons
                name="send"
                size={18}
                color={text.trim() ? '#fff' : c.textMuted}
              />
            </MotiView>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
