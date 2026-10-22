import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/form/button';
import { ListRow, ListSection } from '@/components/list-row';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Links } from '@/constants/links';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session-provider';
import { supabase } from '@/lib/supabase';

export default function MeScreen() {
  const { session, isLoading } = useSession();
  const theme = useTheme();

  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={theme.textSecondary} accessibilityLabel="Loading" />
        ) : session ? (
          <SignedInHeader email={session.user.email} />
        ) : (
          <GuestHeader />
        )}

        {/* Available to everyone, signed in or not. */}
        <ListSection>
          <ListRow
            icon={{ ios: 'questionmark.circle', android: 'help' }}
            title="Help & feedback"
            onPress={() => Linking.openURL(`mailto:${Links.supportEmail}`)}
          />
          <ListRow
            icon={{ ios: 'hand.raised', android: 'privacy_tip' }}
            title="Privacy Policy"
            onPress={() => WebBrowser.openBrowserAsync(Links.privacyPolicy)}
          />
          <ListRow
            icon={{ ios: 'doc.text', android: 'description' }}
            title="Terms of Service"
            onPress={() => WebBrowser.openBrowserAsync(Links.terms)}
          />
          <ListRow
            icon={{ ios: 'info.circle', android: 'info' }}
            title="Version"
            value={Constants.expoConfig?.version}
          />
        </ListSection>
      </ScrollView>
    </TabScreen>
  );
}

function GuestHeader() {
  const router = useRouter();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <BrandLogo width={180} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
        Log in to save places and share how they feel — noise, lighting, crowds — so others can find
        spaces that work for them.
      </ThemedText>
      <View style={styles.buttons}>
        {/* One entry point; the login sheet offers "Create new account" for new users. */}
        <Button title="Log in or sign up" onPress={() => router.push('/login')} />
      </View>
    </ThemedView>
  );
}

// Display name editing comes in the next part; for now this shows who is signed in.
function SignedInHeader({ email }: { email?: string }) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    // 'local' logs out this device only (like Instagram), not the person's other devices.
    // Supabase clears the session on this device even when the network call fails (e.g. offline),
    // so there's no failure worth showing — the user is logged out either way.
    await supabase.auth.signOut({ scope: 'local' });
    setIsSigningOut(false);
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Signed in as</ThemedText>
      <ThemedText themeColor="textSecondary">{email}</ThemedText>
      <View style={styles.buttons}>
        <Button title="Log out" variant="secondary" loading={isSigningOut} onPress={signOut} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  buttons: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
});
