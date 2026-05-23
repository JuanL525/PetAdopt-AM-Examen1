import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { useChat } from '@features/chat/presentation/hooks/useChat';
import { Message } from '@features/chat/domain/entities/Message';
import { getUserInitials } from '@features/auth/domain/entities/User';
import { setActiveRoomId } from '../../../src/services/activeChatRoom';
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

export default function ChatRoom() {
  const { roomId, name } = useLocalSearchParams<{ roomId: string; name?: string }>();
  const user       = useAuthStore((s) => s.user);
  const router     = useRouter();
  const { messages, isLoading, sendMessage, subscribeToRoom } = useChat(roomId || '');
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!roomId) return;
    setActiveRoomId(roomId);
    const unsubscribe = subscribeToRoom();
    return () => {
      setActiveRoomId(null);
      unsubscribe();
    };
  }, [roomId, subscribeToRoom]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const author = item.author;
    const isOwn = author?.id === user?.id;
    const authorInitials = author?.username ? getUserInitials({ username: author.username }) : '?';
    const isSeller = author?.role === 'seller';
    const authorName = author?.username || 'Usuario';

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {/* Avatar */}
        {!isOwn && (
          <View style={[
            styles.msgAvatar,
            isSeller ? styles.sellerAvatar : styles.clientAvatar
          ]}>
            <Text style={styles.msgAvatarText}>{authorInitials}</Text>
          </View>
        )}

        {/* Bubble & Body */}
        <View style={{ maxWidth: '75%' }}>
          {!isOwn && (
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>{authorName}</Text>
              <View style={[
                styles.miniRoleBadge,
                isSeller ? styles.sellerBadge : styles.clientBadge
              ]}>
                <Text style={[
                  styles.miniRoleText,
                  isSeller ? styles.sellerBadgeText : styles.clientBadgeText
                ]}>
                  {isSeller ? 'Vendedor' : 'Cliente'}
                </Text>
              </View>
            </View>
          )}

          <View style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther
          ]}>
            <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
              {item.content}
            </Text>
            <Text style={[styles.timeText, isOwn && styles.timeTextOwn]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AuraBackground />
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="tag-outline" size={18} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name || 'Sala de Soporte'}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: '#34d399' }]} />
        </View>

        {/* Chat Feed */}
        {isLoading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366f1" />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatEmoji}>💬</Text>
                <Text style={styles.emptyChatText}>Sé el primero en escribir</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={
              user?.role === 'client'
                ? 'Escribe tu pregunta sobre el producto...'
                : 'Responde al cliente...'
            }
            placeholderTextColor="#64748b"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <MaterialCommunityIcons name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)', // glassy header
    borderBottomWidth: 1.2,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowOwn: {
    flexDirection: 'row-reverse',
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sellerAvatar: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  clientAvatar: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  msgAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  authorName: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  miniRoleBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
  },
  sellerBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  clientBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  miniRoleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sellerBadgeText: {
    color: '#60a5fa',
  },
  clientBadgeText: {
    color: '#34d399',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: '#6366f1', // glowing indigo bubble
    borderBottomRightRadius: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  bubbleOther: {
    backgroundColor: 'rgba(22, 32, 51, 0.85)', // Opaque frosted glass bubble for high contrast
    borderBottomLeftRadius: 4,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  bubbleText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextOwn: {
    color: '#ffffff',
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
    marginLeft: 4,
  },
  timeTextOwn: {
    textAlign: 'right',
    marginRight: 4,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyChatEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyChatText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.65)', // Glassy input bar
    borderTopWidth: 1.2,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Glassy input
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1', // glowing indigo send button
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    opacity: 0.5,
  },
});
