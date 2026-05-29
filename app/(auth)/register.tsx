import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { Link } from "expo-router";
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

type Role = "adoptante" | "refugio";

const ROLES: { id: Role; emoji: string; label: string; desc: string }[] = [
  {
    id: "adoptante",
    emoji: "🐾",
    label: "Adoptante",
    desc: "Busco una mascota para mi hogar",
  },
  {
    id: "refugio",
    emoji: "🏠",
    label: "Refugio",
    desc: "Tengo mascotas en adopción",
  },
];

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("adoptante");
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error } = useAuth();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space[5],
          paddingTop: insets.top + space[6],
          paddingBottom: insets.bottom + space[8],
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 160, delay: 80 }}
          style={{ alignItems: "center", marginBottom: space[8] }}
        >
          <MotiView
            from={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 200, delay: 150 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.xl,
              backgroundColor: c.secondaryLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space[4],
              ...shadow.md,
            }}
          >
            <Text style={{ fontSize: 34 }}>🐶</Text>
          </MotiView>

          <PetText variant="h1" align="center">
            Crea tu cuenta
          </PetText>
          <PetText variant="body" align="center" style={{ marginTop: space[2] }}>
            Únete y ayuda a encontrar hogares para mascotas
          </PetText>
        </MotiView>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <MotiView
              from={{ opacity: 0, translateY: -8, scale: 0.97 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, translateY: -8 }}
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

        {/* Form fields */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 160, delay: 200 }}
          style={{ gap: space[2] }}
        >
          <PetInput
            label="Nombre de usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="sin espacios"
            leftIcon={
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={c.textMuted}
              />
            }
          />

          <PetInput
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="hola@ejemplo.com"
            leftIcon={
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={c.textMuted}
              />
            }
          />

          <PetInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="mínimo 6 caracteres"
            leftIcon={
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={c.textMuted}
              />
            }
            rightIcon={
              <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={c.textMuted}
                />
              </Pressable>
            }
          />
        </MotiView>

        {/* Role selector */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 160, delay: 320 }}
          style={{ marginTop: space[5] }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: fontWeight.semibold,
              color: c.textSecondary,
              letterSpacing: 0.3,
              marginBottom: space[3],
            }}
          >
            ¿Cuál es tu rol?
          </Text>

          <View style={{ flexDirection: "row", gap: space[3] }}>
            {ROLES.map((r) => {
              const active = role === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  style={{ flex: 1 }}
                >
                  <MotiView
                    animate={{
                      backgroundColor: active ? c.primaryLight : c.bgSurface,
                      borderColor: active ? c.primary : c.border,
                      scale: active ? 1.02 : 1,
                    }}
                    transition={{ type: "spring", damping: 18, stiffness: 200 }}
                    style={{
                      borderWidth: 1.5,
                      borderRadius: radius.lg,
                      padding: space[4],
                      alignItems: "center",
                      gap: space[2],
                      ...shadow.sm,
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{r.emoji}</Text>
                    <Text
                      style={{
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.bold,
                        color: active ? c.primary : c.textPrimary,
                      }}
                    >
                      {r.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: fontSize.xs,
                        color: c.textMuted,
                        textAlign: "center",
                        lineHeight: 16,
                      }}
                    >
                      {r.desc}
                    </Text>

                    <AnimatePresence>
                      {active && (
                        <MotiView
                          from={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", damping: 14, stiffness: 220 }}
                          style={{
                            position: "absolute",
                            top: space[2],
                            right: space[2],
                            width: 20,
                            height: 20,
                            borderRadius: radius.full,
                            backgroundColor: c.primary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialCommunityIcons
                            name="check"
                            size={12}
                            color="#fff"
                          />
                        </MotiView>
                      )}
                    </AnimatePresence>
                  </MotiView>
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {/* CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 160, delay: 420 }}
          style={{ marginTop: space[7] }}
        >
          <PetButton
            label="Crear cuenta"
            onPress={() => register({ email, password, username, role })}
            loading={isLoading}
          />
        </MotiView>

        {/* Footer */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 400, delay: 550 }}
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: space[1],
            marginTop: space[6],
          }}
        >
          <Text style={{ fontSize: fontSize.sm, color: c.textMuted }}>
            ¿Ya tienes cuenta?
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: c.primary,
                  fontWeight: fontWeight.semibold,
                }}
              >
                Inicia sesión
              </Text>
            </Pressable>
          </Link>
        </MotiView>
      </ScrollView>
    </View>
  );
}
