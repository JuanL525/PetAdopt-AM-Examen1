import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { Link } from "expo-router";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { colors, font } from "../theme";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [focus, setFocus] = useState<"user" | "email" | "password" | null>(null);
  const { register, isLoading, error } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>NEXUS CHAT</Text>
      <Text style={styles.title}>Crear cuenta</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Usuario (sin espacios)"
        value={username}
        onChangeText={setUsername}
        onFocus={() => setFocus("user")}
        onBlur={() => setFocus(null)}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        onFocus={() => setFocus("email")}
        onBlur={() => setFocus(null)}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 6 caracteres)"
        value={password}
        onChangeText={setPassword}
        onFocus={() => setFocus("password")}
        onBlur={() => setFocus(null)}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => register({ email, password, username })}
        disabled={isLoading}
      >
        {isLoading ? (
          <Text style={styles.buttonLoading}>CREANDO...</Text>
        ) : (
          <Text style={styles.buttonText}>REGISTRARSE</Text>
        )}
      </TouchableOpacity>
      <Link href="/(auth)/login" style={styles.link}>
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bg,
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
