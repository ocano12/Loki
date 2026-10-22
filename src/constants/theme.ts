import { Platform } from 'react-native';

/** WeClude brand palette, sampled from assets/brand. Use the themed `Colors` below in UI code. */
export const Brand = {
  navy: '#253D89',
  sky: '#88BCDA',
  lime: '#D9E364',
  coral: '#F28478',
} as const;

/**
 * Light and dark themes. Every text/background pair meets WCAG AA (4.5:1).
 * `accent` (coral) fails as text on white — use it for decoration only (icons, dots, borders).
 */
export const Colors = {
  light: {
    text: '#15204A',
    textSecondary: '#545E80',
    background: '#FFFFFF',
    backgroundElement: '#EEF3F9',
    backgroundSelected: '#DCE7F3',
    border: '#D3DCEA',
    primary: Brand.navy,
    onPrimary: '#FFFFFF',
    accent: Brand.coral,
    highlight: Brand.lime,
    danger: '#B42F25',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#AEB7D6',
    background: '#0E1533',
    backgroundElement: '#1A2350',
    backgroundSelected: '#26326A',
    border: '#2C3870',
    // Navy disappears on a dark navy background, so sky takes the primary role in dark mode.
    primary: Brand.sky,
    onPrimary: '#0E1533',
    accent: Brand.coral,
    highlight: Brand.lime,
    danger: '#FF8A7E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
