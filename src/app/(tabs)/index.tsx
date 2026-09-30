import { SymbolView } from 'expo-symbols';
import { StyleSheet } from 'react-native';

import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Placeholder until business search is built in Phase 3.
export default function SearchScreen() {
  const theme = useTheme();

  return (
    <TabScreen title="Search">
      <ThemedView type="backgroundElement" style={styles.searchField}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search' }}
          size={18}
          tintColor={theme.textSecondary}
        />
        <ThemedText themeColor="textSecondary">Find sensory-friendly places</ThemedText>
      </ThemedView>
      <ThemedText type="small" themeColor="textSecondary">
        Business search is coming soon.
      </ThemedText>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
});
