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

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<'client' | 'seller'>('client');
  const [focus, setFocus] = useState<"user" | "email" | "password" | null>(null);
  const { register, isLoading, error } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AuraBackground />

      {/* Main Card Wrapper */}
      <View style={styles.card}>
        <Text style={styles.logo}>AETHERA</Text>
        <Text style={styles.title}>Crear cuenta 🚀</Text>
        
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Input Usuario */}
        <TextInput
          style={[
            styles.input,
            focus === "user" && styles.inputFocused
          ]}
          placeholder="Usuario (sin espacios)"
          value={username}
          onChangeText={setUsername}
          onFocus={() => setFocus("user")}
          onBlur={() => setFocus(null)}
          autoCapitalize="none"
          placeholderTextColor="#64748b"
        />

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
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocus("password")}
          onBlur={() => setFocus(null)}
          secureTextEntry
          placeholderTextColor="#64748b"
        />

        {/* Role Selector */}
        <Text style={styles.sectionLabel}>Selecciona tu rol:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleOption,
              role === 'client' && styles.roleOptionActiveClient
            ]}
            onPress={() => setRole('client')}
          >
            <Text style={[
              styles.roleOptionText,
              role === 'client' && styles.roleOptionTextActiveClient
            ]}>
              👤 Cliente
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleOption,
              role === 'seller' && styles.roleOptionActiveSeller
            ]}
            onPress={() => setRole('seller')}
          >
            <Text style={[
              styles.roleOptionText,
              role === 'seller' && styles.roleOptionTextActiveSeller
            ]}>
              🏷 Vendedor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón Registrarse */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={() => register({ email, password, username, role })}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.buttonText}>CREANDO...</Text>
          ) : (
            <Text style={styles.buttonText}>REGISTRARSE</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <Link href="/(auth)/login" style={styles.link}>
          ¿Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia sesión</Text>
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
    color: '#94a3b8',
    marginBottom: 24,
    textAlign: "center",
    fontWeight: '500',
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    borderColor: '#6366f1',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.2,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  roleOptionActiveClient: {
    borderColor: '#34d399', // Emerald active client border
    backgroundColor: 'rgba(52, 211, 153, 0.15)', // transparent emerald
  },
  roleOptionActiveSeller: {
    borderColor: '#60a5fa', // Blue active seller border
    backgroundColor: 'rgba(96, 165, 250, 0.15)', // transparent blue
  },
  roleOptionText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  roleOptionTextActiveClient: {
    color: '#34d399',
  },
  roleOptionTextActiveSeller: {
    color: '#60a5fa',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
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
    color: '#f87171',
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
    color: '#60a5fa',
    fontWeight: '700',
  },
});
