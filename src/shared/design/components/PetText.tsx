import { Text, TextProps } from 'react-native';
import { fontSize, fontWeight, letterSpacing, lineHeight } from '../tokens';
import { useColors } from '../useColors';

type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodyLarge'
  | 'caption'
  | 'overline'
  | 'label';

interface PetTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function PetText({
  variant = 'body',
  color: textColor,
  align,
  style,
  children,
  ...props
}: PetTextProps) {
  const c = useColors();

  const variantStyles: Record<TextVariant, object> = {
    display: {
      fontSize: fontSize['4xl'],
      fontWeight: fontWeight.black,
      color: c.textPrimary,
      lineHeight: fontSize['4xl'] * lineHeight.tight,
      letterSpacing: letterSpacing.tight,
    },
    h1: {
      fontSize: fontSize['3xl'],
      fontWeight: fontWeight.extrabold,
      color: c.textPrimary,
      lineHeight: fontSize['3xl'] * lineHeight.tight,
      letterSpacing: letterSpacing.tight,
    },
    h2: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: c.textPrimary,
      lineHeight: fontSize['2xl'] * 1.25,
      letterSpacing: letterSpacing.tight,
    },
    h3: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.textPrimary,
      lineHeight: fontSize.xl * 1.3,
    },
    h4: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: c.textPrimary,
      lineHeight: fontSize.lg * 1.35,
    },
    body: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.regular,
      color: c.textSecondary,
      lineHeight: fontSize.base * lineHeight.normal,
    },
    bodyLarge: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.regular,
      color: c.textSecondary,
      lineHeight: fontSize.md * lineHeight.normal,
    },
    caption: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.regular,
      color: c.textMuted,
      lineHeight: fontSize.sm * lineHeight.normal,
    },
    overline: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: c.textMuted,
      letterSpacing: letterSpacing.widest,
      textTransform: 'uppercase',
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      letterSpacing: letterSpacing.wide,
    },
  };

  return (
    <Text
      style={[
        variantStyles[variant],
        textColor ? { color: textColor } : undefined,
        align ? { textAlign: align } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
