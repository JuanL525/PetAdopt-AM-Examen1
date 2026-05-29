import { color, colorsDark } from './tokens';
import { useThemeStore } from './themeStore';

export function useColors() {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? colorsDark : color;
}
