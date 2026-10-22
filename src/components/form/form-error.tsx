import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Form-level error (e.g. "Incorrect email or password"). Renders nothing without a message. */
export function FormError({ message }: { message?: string | null }) {
  const theme = useTheme();
  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.container, { borderColor: theme.danger }]}>
      <SymbolView
        name={{ ios: 'exclamationmark.circle', android: 'error' }}
        size={20}
        tintColor={theme.danger}
      />
      <ThemedText type="small" style={[styles.message, { color: theme.danger }]}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  message: {
    flex: 1,
  },
});
