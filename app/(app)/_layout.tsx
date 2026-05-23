import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="seller" />
      <Stack.Screen name="client" />
      <Stack.Screen name="product/[roomId]" />
      <Stack.Screen name="chat/[roomId]" />
    </Stack>
  );
}
