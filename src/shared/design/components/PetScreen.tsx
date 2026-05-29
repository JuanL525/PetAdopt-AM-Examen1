import { MotiView } from 'moti';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from '../tokens';
import { useColors } from '../useColors';

interface PetScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  padTop?: boolean;
  padH?: number;
}

export function PetScreen({
  children,
  scrollable = false,
  style,
  contentStyle,
  padTop = true,
  padH = space[5],
}: PetScreenProps) {
  const insets = useSafeAreaInsets();
  const c = useColors();

  const inner = (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={{
        flex: 1,
        backgroundColor: c.bgPage,
        paddingTop: padTop ? insets.top : 0,
        ...style,
      }}
    >
      {children}
    </MotiView>
  );

  if (!scrollable) return inner;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={{ flex: 1, backgroundColor: c.bgPage, paddingTop: padTop ? insets.top : 0, ...style }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: padH,
          paddingBottom: insets.bottom + space[8],
          ...contentStyle,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </MotiView>
  );
}
