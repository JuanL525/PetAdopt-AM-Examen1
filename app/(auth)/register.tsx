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
} from "react-native";
import { font } from "../theme";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

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

      <View style={styles.card}>
        {/* Animated Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.logoContainer}>
          <BlurView intensity={25} tint="light" style={styles.logoIconWrapper}>
            <MaterialCommunityIcons name="star-four-points" size={32} color="#6366f1" />
          </BlurView>
          <Text style={styles.logoText}>AETHERA</Text>
          <Text style={styles.title}>Crear cuenta 🚀</Text>
        </Animated.View>
        
        {error && (
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text style={styles.error}>{error}</Text>
          </Animated.View>
        )}

        {/* Input Usuario */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <View style={[
            styles.inputContainer,
            focus === "user" && styles.inputFocused
          ]}>
            <MaterialCommunityIcons name="account-outline" size={20} color="#94a3b8" />
            <TextInput
              style={styles.textInput}
              placeholder="Usuario (sin espacios)"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocus("user")}
              onBlur={() => setFocus(null)}
              autoCapitalize="none"
              placeholderTextColor="#64748b"
            />
          </View>
        </Animated.View>

        {/* Input Correo */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <View style={[
            styles.inputContainer,
            focus === "email" && styles.inputFocused
          ]}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#94a3b8" />
            <TextInput
              style={styles.textInput}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocus("email")}
              onBlur={() => setFocus(null)}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#64748b"
            />
          </View>
        </Animated.View>

        {/* Input Contraseña */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <View style={[
            styles.inputContainer,
            focus === "password" && styles.inputFocused
          ]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#94a3b8" />
            <TextInput
              style={styles.textInput}
              placeholder="Contraseña (mín. 6 caracteres)"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocus("password")}
              onBlur={() => setFocus(null)}
              secureTextEntry
              placeholderTextColor="#64748b"
            />
          </View>
        </Animated.View>

        {/* Role Selector */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Text style={styles.sectionLabel}>Selecciona tu rol:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'client' && styles.roleOptionActiveClient
              ]}
              onPress={() => setRole('client')}
              activeOpacity={0.8}
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
              activeOpacity={0.8}
            >
              <Text style={[
                styles.roleOptionText,
                role === 'seller' && styles.roleOptionTextActiveSeller
              ]}>
                🏷 Vendedor
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Botón Registrarse */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => register({ email, password, username, role })}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.buttonGradient, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>CREANDO...</Text>
              ) : (
                <Text style={styles.buttonText}>REGISTRARSE</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Login Link */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)}>
          <Link href="/(auth)/login" style={styles.link}>
            ¿Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia sesión</Text>
          </Link>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: '#0B0F19', // Deep Midnight Slate background matching UI.md exactly
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
    backgroundColor: 'transparent', // Form floats directly over background as instructed in UI.md
    borderRadius: 24,
    padding: 10,
    borderWidth: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  logoText: {
    fontSize: 34,
    fontWeight: "900",
    color: '#ffffff',
    textAlign: "center",
    marginBottom: 6,
    fontFamily: font.title as any,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    color: '#94a3b8', // text-slate-400
    textAlign: "center",
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // transparent glass style input as per UI.md
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 14,
    gap: 12,
  },
  inputFocused: {
    borderColor: 'rgba(99, 102, 241, 0.5)', // indigo active focus as per UI.md
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    height: '100%',
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 6,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  roleOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  roleOptionActiveClient: {
    borderColor: '#34d399', // Emerald active client border
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  roleOptionActiveSeller: {
    borderColor: '#60a5fa', // Blue active seller border
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
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
  buttonWrapper: {
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonGradient: {
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 24,
    textAlign: "center",
    color: '#94a3b8',
    fontSize: 14,
  },
  linkAccent: {
    color: '#60a5fa', // Blue accent
    fontWeight: '700',
  },
});
