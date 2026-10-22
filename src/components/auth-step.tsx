import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthStepProps = PropsWithChildren<{
  title: string;
  subtitle?: ReactNode;
  /** Primary action, pinned above the keyboard. */
  footer: ReactNode;
  /** Hide the back arrow on steps after the account exists (you can't un-verify a code). */
  canGoBack?: boolean;
}>;

/** Shared frame for sign-up and password-reset screens: back arrow, big question, content, action. */
export function AuthStep({ title, subtitle, footer, canGoBack = true, children }: AuthStepProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          {canGoBack && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={Spacing.three}
              onPress={() => router.back()}
              style={styles.back}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back' }}
                size={22}
                tintColor={theme.text}
              />
            </Pressable>
          )}
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={Spacing.four}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            ) : null}
            {children}
          </ScrollView>
          <View style={styles.footer}>{footer}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  topBar: {
    minHeight: 54,
    justifyContent: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    padding: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    marginBottom: Spacing.two,
  },
  footer: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
});
