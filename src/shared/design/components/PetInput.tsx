import { MotiView } from 'moti';
import { useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { input, fontWeight, radius, space } from '../tokens';
import { useColors } from '../useColors';

interface PetInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function PetInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  ...props
}: PetInputProps) {
  const [focused, setFocused] = useState(false);
  const c = useColors();

  return (
    <View style={{ width: '100%', marginBottom: space[2] }}>
      {label && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: fontWeight.semibold,
            color: error ? c.error : focused ? c.primary : c.textSecondary,
            marginBottom: space[1],
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      )}

      <MotiView
        animate={{
          borderColor: error ? c.error : focused ? c.primary : c.border,
          backgroundColor: focused ? c.bgSurface : c.bgSubtle,
        }}
        transition={{ type: 'timing', duration: 150 }}
        style={{
          height: input.height,
          borderRadius: input.borderRadius,
          borderWidth: input.borderWidth,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: input.paddingH,
          gap: space[2],
        }}
      >
        {leftIcon && <View style={{ opacity: focused ? 1 : 0.5 }}>{leftIcon}</View>}

        <TextInput
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={c.textMuted}
          style={{
            flex: 1,
            fontSize: input.fontSize,
            color: c.textPrimary,
            height: '100%',
          }}
          {...props}
        />

        {rightIcon && <View>{rightIcon}</View>}
      </MotiView>

      {(error || hint) && (
        <MotiView
          from={{ opacity: 0, translateY: -4 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={{ marginTop: space[1] }}
        >
          <Text
            style={{
              fontSize: 12,
              color: error ? c.error : c.textMuted,
              letterSpacing: 0.2,
            }}
          >
            {error ?? hint}
          </Text>
        </MotiView>
      )}
    </View>
  );
}
