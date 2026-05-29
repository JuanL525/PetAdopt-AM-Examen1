import { Text, View } from 'react-native';
import { fontWeight, space } from '../tokens';
import { useColors } from '../useColors';

interface PetDividerProps {
  label?: string;
}

export function PetDivider({ label }: PetDividerProps) {
  const c = useColors();

  if (!label) {
    return (
      <View
        style={{
          height: 1,
          backgroundColor: c.border,
          marginVertical: space[5],
        }}
      />
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        marginVertical: space[5],
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
      <Text
        style={{
          fontSize: 12,
          fontWeight: fontWeight.medium,
          color: c.textMuted,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
    </View>
  );
}
