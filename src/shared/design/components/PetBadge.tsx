import { MotiView } from 'moti';
import { Text } from 'react-native';
import { fontWeight, radius, space } from '../tokens';
import { useColors } from '../useColors';
import { useThemeStore } from '../themeStore';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

interface PetBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function PetBadge({ label, variant = 'neutral', size = 'md' }: PetBadgeProps) {
  const c = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    primary:   { bg: c.primaryLight,              text: c.primaryDark },
    secondary: { bg: c.secondaryLight,            text: c.secondary },
    success:   { bg: isDark ? '#052E1C' : '#D1FAE5', text: isDark ? '#4ADE80' : '#065F46' },
    warning:   { bg: isDark ? '#1C1206' : '#FEF3C7', text: isDark ? '#FBBF24' : '#92400E' },
    error:     { bg: isDark ? '#2D0A0A' : '#FEE2E2', text: isDark ? '#F87171' : '#991B1B' },
    neutral:   { bg: c.bgSubtle,                  text: c.textSecondary },
  };

  const v = variantMap[variant];
  const isSmall = size === 'sm';

  return (
    <MotiView
      from={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 14, stiffness: 200 }}
      style={{
        alignSelf: 'flex-start',
        backgroundColor: v.bg,
        borderRadius: radius.full,
        paddingHorizontal: isSmall ? space[2] : space[3],
        paddingVertical: isSmall ? 3 : space[1],
      }}
    >
      <Text
        style={{
          color: v.text,
          fontSize: isSmall ? 11 : 12,
          fontWeight: fontWeight.semibold,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </MotiView>
  );
}
