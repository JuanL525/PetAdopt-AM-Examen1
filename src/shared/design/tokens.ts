/**
 * Design Tokens — PetAdopt
 *
 * Visual language: Airbnb warmth + Headspace wellness + Linear precision.
 * Palette transmits trust, kindness and modern clarity.
 * Zero StyleSheet — plain objects consumed by Moti / inline styles.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const palette = {
  // Brand coral — warmth, energy, trust (Airbnb-inspired)
  coral50:  '#FFF1EF',
  coral100: '#FFD9D3',
  coral200: '#FFB3A7',
  coral300: '#FF8C7C',
  coral400: '#FF6B57',
  coral500: '#FF5533',   // primary action
  coral600: '#E84528',
  coral700: '#C73620',
  coral800: '#A12918',
  coral900: '#7A1E12',

  // Warm teal — wellness, calm, nature (Headspace-inspired)
  teal50:  '#EFFAF8',
  teal100: '#D0F2EC',
  teal200: '#A1E5D9',
  teal300: '#6DD4C4',
  teal400: '#3EBFAE',
  teal500: '#1FA896',   // secondary action / success
  teal600: '#178A7C',
  teal700: '#0F6B60',
  teal800: '#094D44',
  teal900: '#043029',

  // Warm amber — joy, highlights (Headspace-inspired)
  amber50:  '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  // Neutral warm grays (Linear-inspired warmth in grays)
  neutral0:   '#FFFFFF',
  neutral50:  '#FAFAF8',   // page background
  neutral100: '#F4F4F0',   // subtle bg
  neutral150: '#EBEBЕ6',
  neutral200: '#E2E2DB',   // border
  neutral300: '#C8C8C0',   // divider
  neutral400: '#9A9A90',   // muted text
  neutral500: '#71716A',   // secondary text
  neutral600: '#4A4A44',   // body text
  neutral700: '#2E2E28',   // heading
  neutral800: '#1A1A16',   // extra-dark
  neutral900: '#0D0D0A',

  // Semantic
  red400:   '#F87171',
  red500:   '#EF4444',
  green400: '#4ADE80',
  green500: '#22C55E',
  blue400:  '#60A5FA',
  blue500:  '#3B82F6',
} as const;

export const color = {
  // Backgrounds
  bgPage:      palette.neutral50,
  bgSurface:   palette.neutral0,
  bgSubtle:    palette.neutral100,
  bgInverse:   palette.neutral800,

  // Borders
  border:       palette.neutral200,
  borderStrong: palette.neutral300,

  // Text
  textPrimary:   palette.neutral700,
  textSecondary: palette.neutral500,
  textMuted:     palette.neutral400,
  textOnDark:    palette.neutral0,
  textOnBrand:   palette.neutral0,

  // Brand
  primary:       palette.coral500,
  primaryLight:  palette.coral100,
  primaryDark:   palette.coral700,
  secondary:     palette.teal500,
  secondaryLight:palette.teal100,
  accent:        palette.amber400,

  // Semantic
  success:  palette.teal500,
  warning:  palette.amber500,
  error:    palette.red500,
  info:     palette.blue500,

  // Semantic tinted backgrounds (for alerts, badges, etc.)
  errorBg:      '#FEF2F2',
  errorBorder:  '#FECACA',
  successBg:    '#D1FAE5',
  warningBg:    '#FEF3C7',
  infoBg:       '#EFF6FF',
  infoBorder:   '#BFDBFE',

  // Tabs / Navigation
  tabActive:   palette.coral500,
  tabInactive: palette.neutral400,
} as const;

export type ColorTokens = typeof color;

export const colorsDark: ColorTokens = {
  // Backgrounds
  bgPage:      '#0F0F0D',
  bgSurface:   '#1A1A16',
  bgSubtle:    '#252520',
  bgInverse:   palette.neutral50,

  // Borders
  border:       '#2E2E28',
  borderStrong: '#3D3D36',

  // Text
  textPrimary:   '#F0F0EC',
  textSecondary: '#A8A89E',
  textMuted:     '#66665E',
  textOnDark:    palette.neutral0,
  textOnBrand:   palette.neutral0,

  // Brand (brighter tints on dark bg)
  primary:       palette.coral400,
  primaryLight:  '#3D1209',
  primaryDark:   '#FFB3A7',
  secondary:     palette.teal400,
  secondaryLight:'#07312B',
  accent:        palette.amber300,

  // Semantic
  success:  palette.teal400,
  warning:  palette.amber400,
  error:    palette.red400,
  info:     palette.blue400,

  // Semantic tinted backgrounds
  errorBg:      '#2D0A0A',
  errorBorder:  '#7F1D1D',
  successBg:    '#052E1C',
  warningBg:    '#1C1206',
  infoBg:       '#0C1B2E',
  infoBorder:   '#1E3A5F',

  // Tabs / Navigation
  tabActive:   palette.coral400,
  tabInactive: '#66665E',
};

// ─── Typography ──────────────────────────────────────────────────────────────

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   19,
  xl:   22,
  '2xl':26,
  '3xl':30,
  '4xl':36,
  '5xl':44,
} as const;

export const fontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
  black:     '900' as const,
};

export const lineHeight = {
  tight:  1.2,
  normal: 1.5,
  relaxed:1.7,
};

export const letterSpacing = {
  tight:  -0.5,
  normal:  0,
  wide:    0.4,
  wider:   0.8,
  widest:  1.5,
};

// ─── Spacing ─────────────────────────────────────────────────────────────────
// 4px base unit — matches Linear / Airbnb 4-point grid

export const space = {
  0:   0,
  1:   4,
  2:   8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radius = {
  none: 0,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl':24,
  '3xl':32,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
// iOS-style object shadows that translate to React Native shadow* props

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: palette.neutral700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: palette.neutral700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.neutral700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: palette.neutral700,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  },
  brand: {
    shadowColor: palette.coral500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

// ─── Animation presets ───────────────────────────────────────────────────────

export const duration = {
  fast:   150,
  normal: 250,
  slow:   400,
  slower: 600,
} as const;

export const spring = {
  gentle:  { type: 'spring' as const, damping: 18, stiffness: 160 },
  bouncy:  { type: 'spring' as const, damping: 12, stiffness: 200 },
  snappy:  { type: 'spring' as const, damping: 22, stiffness: 280 },
  wobbly:  { type: 'spring' as const, damping:  8, stiffness: 150 },
} as const;

// ─── Z-Index ─────────────────────────────────────────────────────────────────

export const zIndex = {
  base:   0,
  raised: 10,
  modal:  100,
  toast:  200,
} as const;

// ─── Component token shortcuts ───────────────────────────────────────────────

export const input = {
  height:        56,
  borderRadius:  radius.lg,
  borderWidth:   1.5,
  paddingH:      space[4],
  fontSize:      fontSize.base,
  bg:            palette.neutral0,
  bgFocused:     palette.neutral0,
  border:        palette.neutral200,
  borderFocused: palette.coral500,
  text:          palette.neutral700,
  placeholder:   palette.neutral400,
} as const;

export const button = {
  height:       54,
  borderRadius: radius.lg,
  paddingH:     space[6],
  fontSize:     fontSize.base,
  fontWeight:   fontWeight.bold,
  letterSpacing:letterSpacing.wide,
} as const;

export const card = {
  borderRadius: radius.xl,
  padding:      space[5],
  bg:           palette.neutral0,
  border:       palette.neutral200,
  borderWidth:  1,
} as const;
