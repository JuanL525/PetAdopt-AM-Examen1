import { MotiView, AnimatePresence } from 'moti';
import { Pressable, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fontWeight, fontSize, radius, shadow, space } from '../tokens';
import { useColors } from '../useColors';
import { useThemeStore } from '../themeStore';

interface DrawerMenuItem {
  icon: string;
  label: string;
  route: string;
  color?: string;
}

interface PetDrawerProps {
  open: boolean;
  onClose: () => void;
  username?: string;
  email?: string;
  initials?: string;
  roleLabel?: string;
  roleColor?: string;
  menuItems: DrawerMenuItem[];
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export function PetDrawer({
  open,
  onClose,
  username,
  email,
  initials,
  roleLabel,
  roleColor,
  menuItems,
  onNavigate,
  onLogout,
}: PetDrawerProps) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const brandColor = roleColor ?? c.primary;

  return (
    <AnimatePresence>
      {open && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 200 }}>
          {/* Backdrop */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 200 }}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <Pressable style={{ flex: 1 }} onPress={onClose} />
          </MotiView>

          {/* Drawer panel — timing: no bounce, feels like a real native drawer */}
          <MotiView
            from={{ translateX: -300 }}
            animate={{ translateX: 0 }}
            exit={{ translateX: -300 }}
            transition={{ type: 'timing', duration: 240 }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 288,
              backgroundColor: c.bgSurface,
              paddingTop: insets.top + space[4],
              paddingBottom: insets.bottom + space[4],
              paddingHorizontal: space[5],
              borderRightWidth: 1,
              borderRightColor: c.border,
              ...shadow.xl,
            }}
          >
            {/* Close */}
            <View style={{ alignItems: 'flex-end', marginBottom: space[6] }}>
              <Pressable onPress={onClose} hitSlop={8}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: radius.full,
                    backgroundColor: c.bgSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="close" size={20} color={c.textSecondary} />
                </View>
              </Pressable>
            </View>

            {/* Profile */}
            <View style={{ alignItems: 'center', marginBottom: space[6] }}>
              <MotiView
                from={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'timing', duration: 200, delay: 80 }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: radius.full,
                  backgroundColor: brandColor + '22',
                  borderWidth: 2,
                  borderColor: brandColor + '55',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: space[3],
                }}
              >
                <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: brandColor }}>
                  {initials ?? '?'}
                </Text>
              </MotiView>

              <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.textPrimary }}>
                {username}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: c.textMuted, marginTop: 2, marginBottom: space[2] }}>
                {email}
              </Text>

              <View
                style={{
                  backgroundColor: brandColor + '18',
                  borderRadius: radius.full,
                  paddingHorizontal: space[3],
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: brandColor + '44',
                }}
              >
                <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: brandColor }}>
                  {roleLabel}
                </Text>
              </View>
            </View>

            {/* Menu items */}
            <View style={{ flex: 1, gap: space[1] }}>
              {menuItems.map((item, i) => (
                <MotiView
                  key={item.label}
                  from={{ opacity: 0, translateX: -12 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 180, delay: 60 + i * 40 }}
                >
                  <Pressable onPress={() => { onClose(); onNavigate(item.route); }}>
                    {({ pressed }) => (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: space[3],
                          paddingVertical: space[3],
                          paddingHorizontal: space[3],
                          borderRadius: radius.lg,
                          backgroundColor: pressed ? c.bgSubtle : 'transparent',
                        }}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: radius.md,
                            backgroundColor: (item.color ?? c.primary) + '18',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MaterialCommunityIcons
                            name={item.icon as any}
                            size={19}
                            color={item.color ?? c.primary}
                          />
                        </View>
                        <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: c.textPrimary, flex: 1 }}>
                          {item.label}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={17} color={c.textMuted} />
                      </View>
                    )}
                  </Pressable>
                </MotiView>
              ))}

              {/* Dark mode toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[3],
                  paddingVertical: space[3],
                  paddingHorizontal: space[3],
                  borderRadius: radius.lg,
                  marginTop: space[1],
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: radius.md,
                    backgroundColor: c.bgSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name={isDark ? 'weather-night' : 'weather-sunny'}
                    size={19}
                    color={c.textSecondary}
                  />
                </View>
                <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: c.textPrimary, flex: 1 }}>
                  Modo oscuro
                </Text>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: c.border, true: c.primary + 'AA' }}
                  thumbColor={isDark ? c.primary : c.textMuted}
                />
              </View>
            </View>

            {/* Logout */}
            <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: space[3] }}>
              <Pressable onPress={() => { onClose(); onLogout(); }}>
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space[3],
                      paddingVertical: space[3],
                      paddingHorizontal: space[3],
                      borderRadius: radius.lg,
                      backgroundColor: pressed ? c.errorBg : c.errorBg,
                      borderWidth: 1,
                      borderColor: c.errorBorder,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        backgroundColor: c.errorBorder + '55',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="logout" size={19} color={c.error} />
                    </View>
                    <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: c.error }}>
                      Cerrar sesión
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </MotiView>
        </View>
      )}
    </AnimatePresence>
  );
}
