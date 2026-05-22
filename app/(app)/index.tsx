import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Room } from "@features/chat/domain/entities/Message";
import { useRooms } from "@features/chat/presentation/hooks/useRooms";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ImageBackground,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors, font } from "../theme";

export default function RoomsScreen() {
  const { rooms, isLoading, createRoom, isCreating, createError } = useRooms();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [roomName, setRoomName] = useState("");

  const handleCreate = () => {
    if (!roomName.trim() || isCreating) return;
    createRoom(roomName.trim(), {
      onSuccess: () => {
        setRoomName("");
        setModalVisible(false);
      },
    });
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.roomLeft}>
        <MaterialCommunityIcons name="server" size={24} color={colors.accentPrimary} />
      </View>
      <View style={styles.roomCenter}>
        <Text style={styles.roomName}>{item.name}</Text>
      </View>
      <View style={styles.roomRight}>
        <Text style={styles.roomDate}>{item.createdAt.toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/fondo.avif")}
      style={styles.bg}
      imageStyle={styles.bgImage}
      blurRadius={6}
    >
      <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        renderItem={renderRoom}
        contentContainerStyle={rooms.length === 0 ? { flex: 1 } : undefined}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.empty}>No hay salas aún. ¡Crea una!</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Nueva sala</Text>
            {createError && <Text style={styles.dialogError}>{createError}</Text>}
            <TextInput
              style={styles.dialogInput}
              placeholder="Nombre de la sala"
              value={roomName}
              onChangeText={setRoomName}
              autoFocus
              maxLength={50}
              placeholderTextColor={colors.muted}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, isCreating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Text style={styles.createText}>CREANDO...</Text>
                ) : (
                  <Text style={styles.createText}>CREAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { resizeMode: 'cover', opacity: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: colors.muted, fontSize: 16 },
  roomItem: {
    backgroundColor: colors.surface,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.surface2,
    borderLeftWidth: 4,
    borderLeftColor: colors.accentPrimary,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  roomLeft: { width: 40, alignItems: "center", justifyContent: "center" },
  roomCenter: { flex: 1, paddingHorizontal: 8 },
  roomRight: { minWidth: 80, alignItems: "flex-end" },
  roomName: { fontSize: 16, fontWeight: "800", color: colors.text, textTransform: 'uppercase' },
  roomDate: { fontSize: 12, color: colors.muted },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    backgroundColor: colors.accentPrimary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  fabText: { color: "#000", fontSize: 28, lineHeight: 32 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9,9,14,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.accentPrimary,
  },
  dialogTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12, color: colors.text, fontFamily: font.title as any },
  dialogError: { color: colors.accentSecondary, fontSize: 13, marginBottom: 8 },
  dialogInput: {
    borderWidth: 1,
    borderColor: colors.surface2,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  dialogActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { padding: 10 },
  cancelText: { color: colors.muted, fontSize: 15 },
  createBtn: {
    backgroundColor: colors.accentPrimary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createText: { color: "#000", fontWeight: "700", fontSize: 15 },
});

