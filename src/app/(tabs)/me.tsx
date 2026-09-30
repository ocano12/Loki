import { ActivityIndicator, StyleSheet } from 'react-native';

import { GuestPrompt } from '@/components/guest-prompt';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session-provider';

export default function MeScreen() {
  const { session, isLoading } = useSession();
  const theme = useTheme();

  return (
    <TabScreen title="Me">
      {isLoading ? (
        <ActivityIndicator color={theme.textSecondary} accessibilityLabel="Loading" />
      ) : session ? (
        // Filled in with display name editing and log out in step 5.
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Signed in</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {session.user.email}
          </ThemedText>
        </ThemedView>
      ) : (
        <GuestPrompt
          icon={{ ios: 'person.crop.circle', android: 'person' }}
          title="Log in or create an account"
          message="Rate how places feel — noise, lighting, crowds — and help others find spaces that work for them."
        />
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
});
