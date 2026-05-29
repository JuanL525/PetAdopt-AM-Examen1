import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAiChat } from '@features/ai-chat/presentation/hooks/useAiChat';
import { AiMessage } from '@features/ai-chat/domain/entities/AiMessage';
import { useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize } from '@shared/design';

const SUGGESTIONS = [
  { text: '¿Qué debo darle de comer a un cachorro?', icon: 'food-drumstick', color: '#FF5533', bg: '#FFF1EF', darkBg: '#3D1209' },
  { text: '¿Con qué frecuencia debo llevar mi gato al veterinario?', icon: 'hospital-box', color: '#1FA896', bg: '#EFFAF8', darkBg: '#07312B' },
  { text: '¿Cómo entreno a un perro adulto adoptado?', icon: 'school', color: '#F59E0B', bg: '#FEF3C7', darkBg: '#1C1206' },
  { text: '¿Cuántas vacunas necesita un perro nuevo?', icon: 'shield-plus', color: '#3B82F6', bg: '#EFF6FF', darkBg: '#0C1B2E' },
];

const AI_ACCENT = '#8B5CF6';
const AI_HERO = '#7C3AED';

export default function AiChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messages, isLoading, error, sendMessage, clearChat } = useAiChat();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const AI_LIGHT = isDark ? '#1A1230' : '#F5F3FF';
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;
    const msg = text.trim();
    setText('');
    await sendMessage(msg);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: AiMessage }) => {
    const isUser = item.role === 'user';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250 }}
        style={{
          flexDirection: isUser ? 'row-reverse' : 'row',
          marginBottom: space[4],
          alignItems: 'flex-end',
          gap: space[2],
        }}
      >
        {!isUser && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.full,
              backgroundColor: AI_LIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: AI_ACCENT + '33',
            }}
          >
            <MaterialCommunityIcons name="robot" size={16} color={AI_ACCENT} />
          </View>
        )}

        <View
          style={{
            maxWidth: '78%',
            backgroundColor: isUser ? c.primary : (isDark ? '#1E1535' : '#F5F3FF'),
            borderRadius: radius.xl,
            borderBottomRightRadius: isUser ? radius.xs : radius.xl,
            borderBottomLeftRadius: isUser ? radius.xl : radius.xs,
            paddingHorizontal: space[4],
            paddingVertical: space[3],
            borderWidth: isUser ? 0 : 1,
            borderColor: isUser ? 'transparent' : (isDark ? '#4C1D95' : '#DDD6FE'),
            ...(isUser ? shadow.brand : shadow.sm),
          }}
        >
          <Text
            style={{
              fontSize: fontSize.base,
              lineHeight: 22,
              color: isUser ? '#fff' : c.textPrimary,
            }}
          >
            {item.content}
          </Text>
          <Text
            style={{
              fontSize: 10,
              marginTop: 4,
              textAlign: isUser ? 'right' : 'left',
              color: isUser ? 'rgba(255,255,255,0.7)' : c.textMuted,
            }}
          >
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </MotiView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style="light" />

      {/* Hero Header */}
      <View
        style={{
          backgroundColor: AI_HERO,
          paddingTop: insets.top + space[3],
          paddingHorizontal: space[5],
          paddingBottom: space[5],
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute', right: -36, top: -36,
            width: 160, height: 160, borderRadius: 80,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        />
        <View
          style={{
            position: 'absolute', right: 70, bottom: -24,
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />
        <View
          style={{
            position: 'absolute', left: -16, bottom: 8,
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.full,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </View>
          </Pressable>

          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.full,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.35)',
              }}
            >
              <MaterialCommunityIcons name="robot-excited" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff' }}>
                PetAdopt AI
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: 'rgba(255,255,255,0.82)' }}>
                Asistente de salud y cuidados
              </Text>
            </View>
          </View>

          {messages.length > 0 && (
            <Pressable onPress={clearChat} hitSlop={8}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: radius.full,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color="#fff" />
              </View>
            </Pressable>
          )}
        </View>

        {/* Quick feature pills */}
        <View style={{ flexDirection: 'row', gap: space[2], marginTop: space[4], flexWrap: 'wrap' }}>
          {[
            { icon: 'heart-pulse', label: 'Salud' },
            { icon: 'food-apple', label: 'Nutrición' },
            { icon: 'school', label: 'Entrenamiento' },
          ].map((pill) => (
            <View
              key={pill.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(255,255,255,0.16)',
                borderRadius: radius.full,
                paddingHorizontal: space[3],
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <MaterialCommunityIcons name={pill.icon as any} size={14} color="#fff" />
              <Text style={{ fontSize: fontSize.xs, color: '#fff', fontWeight: fontWeight.semibold }}>
                {pill.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <FlatList
            data={SUGGESTIONS}
            keyExtractor={(s) => s.text}
            ListHeaderComponent={
              <View style={{ alignItems: 'center', paddingTop: space[6], paddingBottom: space[5], gap: space[3] }}>
                <MotiView
                  from={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: radius.full,
                    backgroundColor: isDark ? '#1E1535' : '#F5F3FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: AI_ACCENT + '44',
                    ...shadow.md,
                  }}
                >
                  <MaterialCommunityIcons name="robot-excited" size={42} color={AI_ACCENT} />
                </MotiView>

                <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.textPrimary, textAlign: 'center' }}>
                  ¡Hola! Soy PetAdopt AI
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: c.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: space[4] }}>
                  Puedo ayudarte con preguntas sobre salud, alimentación y cuidados de tu mascota.
                </Text>

                <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: AI_ACCENT, letterSpacing: 1, textTransform: 'uppercase', alignSelf: 'flex-start', marginTop: space[2] }}>
                  Preguntas sugeridas
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingHorizontal: space[5], paddingBottom: space[8] }}
            renderItem={({ item, index }) => (
              <MotiView
                from={{ opacity: 0, translateX: -12 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 250, delay: index * 80 }}
                style={{ marginBottom: space[3] }}
              >
                <Pressable onPress={() => sendMessage(item.text)}>
                  {({ pressed }) => (
                    <MotiView
                      animate={{ scale: pressed ? 0.98 : 1 }}
                      transition={{ type: 'timing', duration: 100 }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space[3],
                        backgroundColor: isDark ? item.darkBg : item.bg,
                        borderRadius: radius.lg,
                        padding: space[4],
                        borderWidth: 1.5,
                        borderColor: pressed ? item.color : item.color + '33',
                        ...shadow.sm,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: radius.full,
                          backgroundColor: item.color + '22',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <Text style={{ flex: 1, fontSize: fontSize.sm, color: c.textPrimary, lineHeight: 20, fontWeight: fontWeight.medium }}>
                        {item.text}
                      </Text>
                      <MaterialCommunityIcons name="arrow-right" size={18} color={item.color} />
                    </MotiView>
                  )}
                </Pressable>
              </MotiView>
            )}
          />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: space[5], paddingBottom: space[3], flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[2],
                backgroundColor: '#FEF2F2',
                borderColor: '#FECACA',
                borderWidth: 1,
                borderRadius: radius.md,
                padding: space[3],
                marginHorizontal: space[5],
                marginBottom: space[2],
              }}
            >
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={c.error} />
              <Text style={{ flex: 1, fontSize: fontSize.sm, color: c.error }}>{error}</Text>
            </MotiView>
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: space[2],
              paddingHorizontal: space[5],
              paddingBottom: space[2],
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.full,
                backgroundColor: AI_LIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="robot" size={16} color={AI_ACCENT} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[2],
                backgroundColor: isDark ? '#1E1535' : '#F5F3FF',
                borderRadius: radius.xl,
                borderBottomLeftRadius: radius.xs,
                paddingHorizontal: space[4],
                paddingVertical: space[3],
                borderWidth: 1,
                borderColor: isDark ? '#4C1D95' : '#DDD6FE',
              }}
            >
              <ActivityIndicator size="small" color={AI_ACCENT} />
              <Text style={{ fontSize: fontSize.sm, color: c.textMuted }}>Pensando...</Text>
            </View>
          </View>
        )}

        {/* Input bar */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: space[4],
            paddingTop: space[3],
            paddingBottom: Math.max(insets.bottom + space[3], space[5]),
            backgroundColor: isDark ? '#1A1230' : '#FAF5FF',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#4C1D95' : '#EDE9FE',
            gap: space[2],
            alignItems: 'flex-end',
          }}
        >
          <MotiView
            animate={{ borderColor: text.length > 0 ? AI_ACCENT : c.border }}
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
              value={text}
              onChangeText={setText}
              placeholder="Pregunta sobre salud, cuidados..."
              placeholderTextColor={c.textMuted}
              multiline
              maxLength={500}
              style={{ fontSize: fontSize.base, color: c.textPrimary, maxHeight: 100 }}
            />
          </MotiView>

          <Pressable onPress={handleSend} disabled={!text.trim() || isLoading}>
            <MotiView
              animate={{ backgroundColor: text.trim() && !isLoading ? AI_ACCENT : c.bgSubtle }}
              transition={{ type: 'timing', duration: 180 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                ...shadow.sm,
              }}
            >
              <MaterialCommunityIcons
                name="send"
                size={18}
                color={text.trim() && !isLoading ? '#fff' : c.textMuted}
              />
            </MotiView>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
