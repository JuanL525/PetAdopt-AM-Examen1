import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { Message } from "@features/chat/domain/entities/Message";
import { useChat } from "@features/chat/presentation/hooks/useChat";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { setActiveRoomId } from "../../../src/services/activeChatRoom";
import { colors, font } from "../../theme";

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { messages, sendMessage, isLoading } = useChat(roomId);
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  useEffect(() => {
    setActiveRoomId(roomId);
    return () => setActiveRoomId(null);
  }, [roomId]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, sendMessage]);

  const renderMsg = ({ item }: { item: Message }) => {
    const isOwn = item.userId === user?.id;
    return (
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        {!isOwn && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.authorUsername?.[0]?.toUpperCase() ?? "U"}</Text>
          </View>
        )}
        <View style={[styles.bubble, isOwn ? styles.own : styles.other]}>
          {!isOwn && <Text style={styles.author}>{item.authorUsername}</Text>}
          <Text style={[styles.text, isOwn && styles.textOwn]}>
            {item.content}
          </Text>
          <Text style={styles.time}>
            {item.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {isOwn && (
          <View style={{ width: 32 }} />
        )}
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/fondo.avif")}
      style={styles.bg}
      imageStyle={styles.bgImage}
      blurRadius={6}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMsg}
        contentContainerStyle={{ padding: 12 }}
      />
      <View style={styles.inputRow}>
        <View style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
        </View>
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <MaterialCommunityIcons name="send" size={18} color="#000" />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { resizeMode: 'cover', opacity: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  row: { flexDirection: "row", marginVertical: 6 },
  rowOwn: { justifyContent: "flex-end" },
  bubble: { maxWidth: "75%", borderRadius: 12, padding: 10 },
  own: {
    backgroundColor: "#002b33",
    borderRightWidth: 3,
    borderColor: colors.accentPrimary,
    borderBottomRightRadius: 0,
  },
  other: {
    backgroundColor: "#1a1a26",
    borderLeftWidth: 3,
    borderColor: colors.accentSecondary,
    borderBottomLeftRadius: 0,
  },
  author: { fontSize: 10, fontWeight: "800", color: colors.accentSecondary, marginBottom: 6, textTransform: 'uppercase' },
  text: { fontSize: 15, color: colors.text, fontFamily: font.body as any },
  textOwn: { color: colors.accentPrimary },
  time: { fontSize: 10, color: colors.muted, marginTop: 6, alignSelf: "flex-end" },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.surface2,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a2a3d',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  inputWrapperFocused: {
    borderColor: colors.accentPrimary,
  },
  input: {
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: colors.accentPrimary,
    borderRadius: 6,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: { color: "#000", fontSize: 18 },
  avatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { color: colors.text, fontWeight: '800' },
});


