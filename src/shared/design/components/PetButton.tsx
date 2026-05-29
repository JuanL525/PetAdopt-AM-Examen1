import { MotiView } from 'moti';
import { useAnimationState } from 'moti';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { button, fontWeight, letterSpacing, shadow } from '../tokens';
import { useColors } from '../useColors';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface PetButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function PetButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}: PetButtonProps) {
  const c = useColors();

  const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary:   { bg: c.primary,    text: c.textOnBrand },
    secondary: { bg: c.secondary,  text: c.textOnBrand },
    outline:   { bg: 'transparent', text: c.primary,    border: c.primary },
    ghost:     { bg: 'transparent', text: c.textSecondary },
    danger:    { bg: c.error,      text: c.textOnBrand },
  };

  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  const pressState = useAnimationState({
    idle:    { scale: 1,    opacity: 1 },
    pressed: { scale: 0.97, opacity: 0.88 },
  });

  return (
    <Pressable
      onPressIn={() => !isDisabled && pressState.transitionTo('pressed')}
      onPressOut={() => !isDisabled && pressState.transitionTo('idle')}
      onPress={() => !isDisabled && onPress()}
      style={{ width: fullWidth ? '100%' : undefined }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MotiView
        state={pressState}
        transition={{ type: 'timing', duration: 120 }}
        style={{
          height: button.height,
          borderRadius: button.borderRadius,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border ?? 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: button.paddingH,
          opacity: isDisabled ? 0.52 : 1,
          ...(variant === 'primary' ? shadow.brand : shadow.none),
        }}
      >
        {loading ? (
          <ActivityIndicator color={v.text} size="small" />
        ) : (
          <>
            {icon && <View>{icon}</View>}
            <Text
              numberOfLines={1}
              style={{
                color: v.text,
                fontSize: button.fontSize,
                fontWeight: button.fontWeight,
                letterSpacing: button.letterSpacing,
                flexShrink: 1,
              }}
            >
              {label}
            </Text>
          </>
        )}
      </MotiView>
    </Pressable>
  );
}
