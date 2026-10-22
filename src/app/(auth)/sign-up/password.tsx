import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthStep } from '@/components/auth-step';
import { Button } from '@/components/form/button';
import { FormError } from '@/components/form/form-error';
import { FormTextField } from '@/components/form/form-text-field';
import { ThemedText } from '@/components/themed-text';
import { Links } from '@/constants/links';
import { useCloseAuth } from '@/hooks/use-close-auth';
import { useTheme } from '@/hooks/use-theme';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { MIN_PASSWORD_LENGTH, newPasswordField, PASSWORD_RULES } from '@/lib/auth-schemas';
import { SIGNUP_PENDING_KEY, useSignUp } from '@/lib/sign-up-context';
import { supabase } from '@/lib/supabase';

const passwordSchema = z.object({ password: newPasswordField });

type PasswordValues = z.infer<typeof passwordSchema>;

export default function SignUpPasswordScreen() {
  const router = useRouter();
  const closeAuth = useCloseAuth();
  const theme = useTheme();
  const { draft, markComplete } = useSignUp();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  // The one place sign-up writes personal details: everything collected so far, in one go.
  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    const { fullName, birthDate } = draft;
    // useSession() reports a guest until sign-up finishes, so read the bare account's session directly.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !fullName || !birthDate) {
      // Details were lost (e.g. the app restarted); collect them again.
      router.replace('/sign-up/name');
      return;
    }

    // Public: shown next to this person's ratings and notes.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: fullName })
      .eq('id', session.user.id);
    if (profileError) {
      setFormError("Couldn't create your account. Please try again.");
      return;
    }

    // Private: birthday lives on the auth account, visible only to this user. Setting the password
    // is what makes this a finished, active account.
    const { error } = await supabase.auth.updateUser({
      password,
      // onboarding_complete was the earlier flow's flag; null clears it.
      data: { birth_date: birthDate, [SIGNUP_PENDING_KEY]: false, onboarding_complete: null },
    });
    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }
    markComplete();
    closeAuth();
  });

  const link = (title: string, url: string) => (
    <ThemedText
      type="small"
      accessibilityRole="link"
      style={{ color: theme.primary, fontWeight: 700 }}
      onPress={() => WebBrowser.openBrowserAsync(url)}>
      {title}
    </ThemedText>
  );

  return (
    <AuthStep
      title="Create a password"
      subtitle={`Use at least ${MIN_PASSWORD_LENGTH} characters — something others can't guess.`}
      footer={
        <>
          <ThemedText type="small" themeColor="textSecondary">
            By signing up, you agree to our {link('Terms', Links.terms)} and{' '}
            {link('Privacy Policy', Links.privacyPolicy)}.
          </ThemedText>
          <Button title="Sign up" loading={isSubmitting} onPress={onSubmit} />
        </>
      }>
      <FormError message={formError} />
      <FormTextField
        control={control}
        name="password"
        label="Password"
        autoFocus
        secureToggle
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        passwordRules={PASSWORD_RULES}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </AuthStep>
  );
}
