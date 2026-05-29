import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  useColors, useThemeStore, space, radius, shadow, fontWeight, fontSize,
  PetButton, PetInput, PetDivider, PetText,
} from "@shared/design";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, isLoading, error } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { height: screenH } = useWindowDimensions();
  // On small phones (< 700 dp) shrink the hero image so everything fits
  const heroHeight = screenH < 700 ? 130 : screenH < 800 ? 170 : 210;
  const heroMarginBottom = screenH < 700 ? space[4] : space[8];
  const scrollPaddingTop = screenH < 700 ? insets.top + space[2] : insets.top + space[4];

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      // error handled by store
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space[5],
          paddingTop: scrollPaddingTop,
          paddingBottom: insets.bottom + space[5],
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 160, delay: 80 }}
          style={{ alignItems: "center", marginBottom: heroMarginBottom }}
        >
          <MotiView
            from={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 16, stiffness: 180, delay: 120 }}
            style={{ width: "100%", alignItems: "center", marginBottom: space[4] }}
          >
            <Image
              source={require("../../assets/images/Cat and dog-login.svg")}
              style={{ width: "100%", height: heroHeight }}
              resizeMode="contain"
            />
          </MotiView>

          <PetText
            variant="h1"
            align="center"
            style={screenH < 700 ? { fontSize: fontSize.xl } : undefined}
          >
            Bienvenido de vuelta
          </PetText>
          {screenH >= 700 && (
            <PetText
              variant="body"
              align="center"
              style={{ marginTop: space[0] }}
            >
              Inicia sesión para continuar ayudando a encontrar hogares
            </PetText>
          )}
        </MotiView>

        {/* Form */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: -25 }}
          transition={{ type: "spring", damping: 18, stiffness: 160, delay: 220 }}
          style={{ gap: screenH < 700 ? space[1] : space[1] }}
        >
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
            leftIcon={
              <MaterialCommunityIcons
                name="email-outline"
                size={25}
                color={c.textMuted}
              />
            }
          />

          <PetInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Tu contraseña"
            leftIcon={
              <MaterialCommunityIcons
                name="lock-outline"
                size={25}
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

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={{ alignSelf: "flex-end", marginTop: -space[1] }}>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: c.primary,
                  fontWeight: fontWeight.semibold,
                }}
              >
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </Link>

          <View style={{ marginTop: screenH < 700 ? space[1] : space[2] }}>
            <PetButton
              label="Iniciar sesión"
              onPress={() => login({ email, password })}
              loading={isLoading}
            />
          </View>

          <PetDivider label="o continúa con" />

          <PetButton
            label={isGoogleLoading ? "Conectando..." : "Continuar con Google"}
            onPress={handleGoogleLogin}
            loading={isGoogleLoading}
            variant="outline"
            icon={
              <MaterialCommunityIcons name="google" size={20} color={c.primary} />
            }
          />
        </MotiView>

        {/* Footer */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 400, delay: 500 }}
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: space[1],
            marginTop: screenH < 700 ? space[4] : space[0],
          }}
        >
          <Text
            style={{
              fontSize: fontSize.sm,
              color: c.textMuted,
            }}
          >
            ¿No tienes cuenta?
          </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: c.primary,
                  fontWeight: fontWeight.semibold,
                }}
              >
                Regístrate gratis
              </Text>
            </Pressable>
          </Link>
        </MotiView>
      </ScrollView>
    </View>
  );
}
