import { zodResolver } from '@hookform/resolvers/zod';
import { isAuthError } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/form/button';
import { FormError } from '@/components/form/form-error';
import { FormTextField } from '@/components/form/form-text-field';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useResumeSignUp } from '@/hooks/use-resume-sign-up';
import { useTheme } from '@/hooks/use-theme';
import { getAccountStatus, isUnfinished } from '@/lib/account-status';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { emailField } from '@/lib/auth-schemas';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: 'Enter your password.' }),
});

type LoginInput = z.input<typeof loginSchema>;
type LoginValues = z.output<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  // Set when coming back from "You already have an account" on sign-up.
  const { email: suggestedEmail } = useLocalSearchParams<{ email?: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const { resume } = useResumeSignUp();

  const {
    control,
    handleSubmit,
    getValues,
    setFocus,
    setValue,
    formState: { isSubmitting },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: suggestedEmail ?? '', password: '' },
  });

  useEffect(() => {
    if (!suggestedEmail) return;
    setValue('email', suggestedEmail);
    setFocus('password');
  }, [suggestedEmail, setValue, setFocus]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      // The session provider picks up the new session; close the sheet and return to where we were.
      router.back();
      return;
    }
    const isCredentialsError = isAuthError(error) && error.code === 'invalid_credentials';
    const isUnconfirmedError = isAuthError(error) && error.code === 'email_not_confirmed';
    if (!isCredentialsError && !isUnconfirmedError) {
      setFormError(getAuthErrorMessage(error));
      return;
    }
    // Supabase only says "invalid credentials"; work out which case it is so we can help.
    try {
      const status = isUnconfirmedError ? 'unverified' : await getAccountStatus(email);
      if (status === 'none') {
        setFormError("We couldn't find an account with that email. Check it, or create a new account.");
      } else if (isUnfinished(status)) {
        promptToFinishSignUp(email);
      } else {
        setFormError('Incorrect password. Try again, or reset it below.');
      }
    } catch {
      setFormError(getAuthErrorMessage(error));
    }
  });

  // A started-but-unfinished sign-up has no real password yet, so offer to pick it back up.
  const promptToFinishSignUp = (email: string) => {
    Alert.alert(
      'Finish creating your account',
      `You started signing up with ${email} but didn't finish. We'll send you a new code so you can pick up where you left off.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Finish signing up',
          isPreferred: true,
          onPress: async () => {
            const resumeError = await resume(email);
            if (resumeError) setFormError(resumeError);
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={Spacing.three}
          onPress={() => router.back()}
          style={styles.close}>
          <SymbolView name={{ ios: 'xmark', android: 'close' }} size={22} tintColor={theme.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <View style={styles.logo}>
            <BrandLogo width={220} />
          </View>

          <FormError message={formError} />

          <FormTextField
            control={control}
            name="email"
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="email"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => setFocus('password')}
          />
          <FormTextField
            control={control}
            name="password"
            label="Password"
            secureToggle
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />

          <Button title="Log in" loading={isSubmitting} onPress={onSubmit} />
          <Button
            title="Forgot password?"
            variant="text"
            onPress={() =>
              router.push({ pathname: '/forgot-password', params: { email: getValues('email').trim() } })
            }
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Create new account"
            variant="secondary"
            onPress={() => router.push('/sign-up/email')}
          />
        </View>
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
  close: {
    alignSelf: 'flex-start',
    padding: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  logo: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
});
