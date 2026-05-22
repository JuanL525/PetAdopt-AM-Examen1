import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { Link } from "expo-router";
import { useState } from "react";
import {
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors, font } from "../theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState<"email" | "password" | null>(null);
  const { login, isLoading, error } = useAuth();

  return (
    <ImageBackground
      source={require("../../assets/images/fondo.avif")}
      style={styles.bg}
      imageStyle={styles.bgImage}
      blurRadius={6}
    >
      <View style={styles.container}>
        <Text style={styles.logo}>NEXUS CHAT</Text>
        <Text style={styles.title}>Bienvenido 👋</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        onFocus={() => setFocus("email")}
        onBlur={() => setFocus(null)}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        onFocus={() => setFocus("password")}
        onBlur={() => setFocus(null)}
        secureTextEntry
        placeholderTextColor={colors.muted}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => login({ email, password })}
        disabled={isLoading}
      >
        {isLoading ? (
          <Text style={styles.buttonLoading}>CARGANDO...</Text>
        ) : (
          <Text style={styles.buttonText}>INGRESAR</Text>
        )}
      </TouchableOpacity>
      <Link href="/(auth)/register" style={styles.link}>
        ¿No tienes cuenta? Regístrate
      </Link>
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { resizeMode: 'cover', opacity: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: 'transparent',
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.accentPrimary,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: font.title as any,
    letterSpacing: 2,
  },
  title: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 14,
    textAlign: "center",
    fontFamily: font.body as any,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.surface2,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accentPrimary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 2,
  },
  buttonLoading: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: 14,
  },
  error: { color: colors.accentSecondary, marginBottom: 12, textAlign: "center" },
  link: { marginTop: 16, textAlign: "center", color: colors.accentPrimary },
});
