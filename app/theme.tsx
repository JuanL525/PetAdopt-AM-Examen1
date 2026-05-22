import { Platform } from "react-native";

export const colors = {
  bg: "#050505",
  surface: "#0f0f16",
  surface2: "#2a2a3d",
  accentPrimary: "#00f0ff",
  accentSecondary: "#ff003c",
  accentTertiary: "#00ff41",
  text: "#FFFFFF",
  muted: "#8b8b9f",
};

export const neonShadow = (accent = colors.accentPrimary) =>
  Platform.select({
    ios: {
      shadowColor: accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    android: {
      elevation: 10,
    },
    default: {},
  });

export const font = {
  // Prefer a sci-fi display font if available, fallback to monospace
  title: Platform.select({ ios: "Orbitron", android: "monospace", default: "monospace" }),
  body: Platform.select({ ios: "Rajdhani", android: "monospace", default: "monospace" }),
};

export default { colors, neonShadow, font };
