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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState<"email" | "password" | null>(null);
  const { login, isLoading, error } = useAuth();

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
          <Text style={styles.title}>Iniciar Sesión</Text>
        </Animated.View>
        
        {error && (
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text style={styles.error}>{error}</Text>
          </Animated.View>
        )}

        {/* Input Correo */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
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
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <View style={[
            styles.inputContainer,
            focus === "password" && styles.inputFocused
          ]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#94a3b8" />
            <TextInput
              style={styles.textInput}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocus("password")}
              onBlur={() => setFocus(null)}
              secureTextEntry
              placeholderTextColor="#64748b"
            />
          </View>
        </Animated.View>

        {/* Botón Ingresar */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => login({ email, password })}
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
                <Text style={styles.buttonText}>CARGANDO...</Text>
              ) : (
                <Text style={styles.buttonText}>INGRESAR</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Registro Link */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Link href="/(auth)/register" style={styles.link}>
            ¿No tienes cuenta? <Text style={styles.linkAccent}>Regístrate</Text>
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
    marginBottom: 24,
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
    height: 56,
    marginBottom: 16,
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
