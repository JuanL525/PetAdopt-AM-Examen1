import { SupabaseAuthRepository } from "@features/auth/infrastructure/repositories/SupabaseAuthRepository";
import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

const authRepo = new SupabaseAuthRepository();

export default function AppLayout() {
  const { setUser } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authRepo.logout();
    } finally {
      setUser(null);
      router.replace("/(auth)/login");
    }
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#007AFF" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Salas de Chat",
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 4 }}>
              <Text style={{ color: "#fff", fontSize: 14 }}>Salir</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="chat/[roomId]" options={{ title: "Chat" }} />
    </Stack>
  );
}


