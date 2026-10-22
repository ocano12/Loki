import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListRowProps = {
  icon: SymbolViewProps['name'];
  title: string;
  /** Right-aligned secondary text; rows with a value and no onPress are read-only. */
  value?: string;
  onPress?: () => void;
};

/** A settings-style row: icon, title, and either a value or a chevron. */
export function ListRow({ icon, title, value, onPress }: ListRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
      <SymbolView name={icon} size={20} tintColor={theme.primary} />
      <ThemedText style={styles.title}>{title}</ThemedText>
      {value ? (
        <ThemedText type="small" themeColor="textSecondary">
          {value}
        </ThemedText>
      ) : onPress ? (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right' }}
          size={14}
          tintColor={theme.textSecondary}
        />
      ) : null}
    </Pressable>
  );
}

/** Rounded group that ListRows sit in, with hairline separators. */
export function ListSection({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  title: {
    flex: 1,
  },
});
