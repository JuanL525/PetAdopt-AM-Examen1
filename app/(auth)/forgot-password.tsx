import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetButton, PetInput, PetText,
} from "@shared/design";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { forgotPassword, isLoading, error } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  const handleSend = async () => {
    if (!email.trim()) return;
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      // error handled by store
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space[5],
          paddingTop: insets.top + space[6],
          paddingBottom: insets.bottom + space[8],
          justifyContent: "center",
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatePresence exitBeforeEnter>
          {!sent ? (
            <MotiView
              key="form"
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -24 }}
              transition={{ type: "spring", damping: 18, stiffness: 160 }}
            >
              {/* Back button */}
              <Pressable
                onPress={() => router.back()}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space[1],
                  marginBottom: space[8],
                  alignSelf: "flex-start",
                }}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={20}
                  color={c.textSecondary}
                />
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    color: c.textSecondary,
                    fontWeight: fontWeight.medium,
                  }}
                >
                  Volver
                </Text>
              </Pressable>

              {/* Icon */}
              <MotiView
                from={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 14, stiffness: 200, delay: 100 }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: radius.xl,
                  backgroundColor: c.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: space[5],
                  ...shadow.md,
                }}
              >
                <MaterialCommunityIcons
                  name="lock-reset"
                  size={34}
                  color={c.primary}
                />
              </MotiView>

              <PetText variant="h2" style={{ marginBottom: space[2] }}>
                Recuperar contraseña
              </PetText>
              <PetText variant="body" style={{ marginBottom: space[7] }}>
                Ingresa tu correo y te enviaremos un enlace para restablecer tu
                contraseña. El enlace expira en 1 hora.
              </PetText>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <MotiView
                    from={{ opacity: 0, translateY: -8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "timing", duration: 200 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: c.errorBg,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: c.errorBorder,
                      padding: space[4],
                      gap: space[2],
                      marginBottom: space[3],
                    }}
                  >
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={18}
                      color={c.error}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: fontSize.sm,
                        color: c.error,
                        fontWeight: fontWeight.medium,
                      }}
                    >
                      {error}
                    </Text>
                  </MotiView>
                )}
              </AnimatePresence>

              <PetInput
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="hola@ejemplo.com"
                autoFocus
                leftIcon={
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={c.textMuted}
                  />
                }
              />

              <View style={{ marginTop: space[5] }}>
                <PetButton
                  label="Enviar enlace"
                  onPress={handleSend}
                  loading={isLoading}
                  disabled={!email.trim()}
                  icon={
                    <MaterialCommunityIcons
                      name="send-outline"
                      size={18}
                      color="#fff"
                    />
                  }
                />
              </View>
            </MotiView>
          ) : (
            <MotiView
              key="success"
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 16, stiffness: 180 }}
              style={{ alignItems: "center", gap: space[5] }}
            >
              <MotiView
                from={{ scale: 0, rotate: "-15deg" }}
                animate={{ scale: 1, rotate: "0deg" }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 100 }}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: radius.full,
                  backgroundColor: c.secondaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  ...shadow.md,
                }}
              >
                <MaterialCommunityIcons
                  name="email-check-outline"
                  size={44}
                  color={c.secondary}
                />
              </MotiView>

              <View style={{ alignItems: "center", gap: space[2] }}>
                <PetText variant="h2" align="center">
                  ¡Enlace enviado!
                </PetText>
                <PetText variant="body" align="center">
                  Revisa tu bandeja de entrada en{"\n"}
                  <Text
                    style={{ fontWeight: fontWeight.semibold, color: c.textPrimary }}
                  >
                    {email}
                  </Text>
                </PetText>
              </View>

              <View
                style={{
                  backgroundColor: c.bgSubtle,
                  borderRadius: radius.lg,
                  padding: space[4],
                  width: "100%",
                  gap: space[2],
                }}
              >
                {["Revisa también la carpeta de spam", "El enlace expira en 1 hora", "Solo funciona una vez"].map(
                  (tip, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: space[2],
                      }}
                    >
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={16}
                        color={c.textMuted}
                      />
                      <Text
                        style={{
                          fontSize: fontSize.sm,
                          color: c.textSecondary,
                        }}
                      >
                        {tip}
                      </Text>
                    </View>
                  )
                )}
              </View>

              <View style={{ width: "100%", marginTop: space[2] }}>
                <PetButton
                  label="Volver al inicio de sesión"
                  onPress={() => router.replace("/(auth)/login")}
                  variant="outline"
                />
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </ScrollView>
    </View>
  );
}
