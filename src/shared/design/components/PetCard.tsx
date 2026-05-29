import { MotiView } from 'moti';
import { Pressable, View, ViewStyle } from 'react-native';
import { card, radius, shadow, space } from '../tokens';
import { useColors } from '../useColors';

interface PetCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  elevated?: boolean;
  noBorder?: boolean;
}

export function PetCard({
  children,
  onPress,
  style,
  padding = card.padding,
  elevated = false,
  noBorder = false,
}: PetCardProps) {
  const c = useColors();

  if (!onPress) {
    return (
      <View
        style={{
          backgroundColor: c.bgSurface,
          borderRadius: card.borderRadius,
          borderWidth: noBorder ? 0 : card.borderWidth,
          borderColor: c.border,
          padding,
          ...(elevated ? shadow.md : shadow.sm),
          ...style,
        }}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <MotiView
          animate={{ scale: pressed ? 0.98 : 1, opacity: pressed ? 0.92 : 1 }}
          transition={{ type: 'timing', duration: 100 }}
          style={{
            backgroundColor: c.bgSurface,
            borderRadius: card.borderRadius,
            borderWidth: noBorder ? 0 : card.borderWidth,
            borderColor: c.border,
            padding,
            ...(elevated ? shadow.md : shadow.sm),
            ...style,
          }}
        >
          {children}
        </MotiView>
      )}
    </Pressable>
  );
}
