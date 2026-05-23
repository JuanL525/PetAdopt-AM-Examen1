import { useAuth } from "@features/auth/presentation/hooks/useAuth";
import { Link } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Platform
} from "react-native";
import { font } from "../theme";
import { BlurView } from "expo-blur";

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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState<"email" | "password" | null>(null);
  const { login, isLoading, error } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AuraBackground />

      {/* Main Card Wrapper */}
      <View style={styles.card}>
        <Text style={styles.logo}>AETHERA</Text>
        <Text style={styles.title}>Iniciar Sesión</Text>
        
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Input Correo */}
        <TextInput
          style={[
            styles.input,
            focus === "email" && styles.inputFocused
          ]}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocus("email")}
          onBlur={() => setFocus(null)}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#64748b"
        />

        {/* Input Contraseña */}
        <TextInput
          style={[
            styles.input,
            focus === "password" && styles.inputFocused
          ]}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocus("password")}
          onBlur={() => setFocus(null)}
          secureTextEntry
          placeholderTextColor="#64748b"
        />

        {/* Botón Ingresar */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={() => login({ email, password })}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.buttonText}>CARGANDO...</Text>
          ) : (
            <Text style={styles.buttonText}>INGRESAR</Text>
          )}
        </TouchableOpacity>

        {/* Registro Link */}
        <Link href="/(auth)/register" style={styles.link}>
          ¿No tienes cuenta? <Text style={styles.linkAccent}>Regístrate</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
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
    bottom: '-20%',
    right: '-40%',
    width: 650,
    height: 650,
    borderRadius: 325,
    backgroundColor: 'rgba(192, 38, 211, 0.15)', // soft out-of-focus fuchsia glow
  },
  card: {
    backgroundColor: 'rgba(22, 32, 51, 0.8)', // Opaque Slate Glass surface for high contrast
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.09)', // sutil white border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  logo: {
    fontSize: 34,
    fontWeight: "900",
    color: '#ffffff',
    textAlign: "center",
    marginBottom: 4,
    fontFamily: font.title as any,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    color: '#94a3b8', // text-slate-400
    marginBottom: 24,
    textAlign: "center",
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)', // transparent white
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    color: '#ffffff',
    fontSize: 15,
  },
  inputFocused: {
    borderColor: '#6366f1', // Indigo focus border
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    backgroundColor: '#6366f1', // Indigo button
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 1,
  },
  error: {
    color: '#f87171', // Red accent
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    color: '#94a3b8',
    fontSize: 14,
  },
  linkAccent: {
    color: '#60a5fa', // Blue accent
    fontWeight: '700',
  },
});
