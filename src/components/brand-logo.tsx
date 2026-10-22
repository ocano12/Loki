import { Image } from 'expo-image';
import { useColorScheme } from 'react-native';

// Source files are 4000×1602; keep that ratio so the logo never stretches.
const ASPECT_RATIO = 4000 / 1602;

/** Full "weClude — Positively Inclusive" logo, switching to the reverse version in dark mode. */
export function BrandLogo({ width = 220 }: { width?: number }) {
  const scheme = useColorScheme();
  const source =
    scheme === 'dark'
      ? require('@/assets/brand/WeClude_Reverse_DarkBackgrounds.png')
      : require('@/assets/brand/WeClude_Primary_FullColor.png');

  return (
    <Image
      source={source}
      style={{ width, height: width / ASPECT_RATIO }}
      contentFit="contain"
      accessible
      accessibilityLabel="WeClude, positively inclusive"
    />
  );
}
