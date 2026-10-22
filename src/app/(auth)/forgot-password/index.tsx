import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthStep } from '@/components/auth-step';
import { Button } from '@/components/form/button';
import { FormError } from '@/components/form/form-error';
import { FormTextField } from '@/components/form/form-text-field';
import { useResumeSignUp } from '@/hooks/use-resume-sign-up';
import { getAccountStatus, isUnfinished } from '@/lib/account-status';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { emailField } from '@/lib/auth-schemas';
import { supabase } from '@/lib/supabase';

const resetSchema = z.object({ email: emailField });

type ResetInput = z.input<typeof resetSchema>;
type ResetValues = z.output<typeof resetSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  // Pre-filled with whatever was typed on the login screen.
  const { email: typedEmail } = useLocalSearchParams<{ email?: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [unfinishedEmail, setUnfinishedEmail] = useState<string | null>(null);
  const { resume, isResuming } = useResumeSignUp();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetInput, unknown, ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: typedEmail ?? '' },
  });

  const resetResult = () => {
    setFormError(null);
    setNoAccount(false);
    setUnfinishedEmail(null);
  };

  const onSubmit = handleSubmit(async ({ email }) => {
    resetResult();
    // Supabase's reset call succeeds even for unknown emails (no code is sent), which would leave
    // the person waiting for an email that never comes — so check first.
    try {
      const status = await getAccountStatus(email);
      if (status === 'none') {
        setNoAccount(true);
        setFormError("We couldn't find an account with that email.");
        return;
      }
      if (isUnfinished(status)) {
        // No password to reset yet — they never finished signing up.
        setUnfinishedEmail(email);
        setFormError("You haven't finished creating your account yet.");
        return;
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }
    // Sends the Reset Password email with a 6-digit code.
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }
    router.push({ pathname: '/forgot-password/code', params: { email } });
  });

  return (
    <AuthStep
      title="Reset your password"
      subtitle="Enter the email you use for WeClude and we'll send you a code to reset your password."
      footer={
        <>
          {unfinishedEmail ? (
            // Nothing to reset yet: the only way forward is to finish signing up.
            <Button
              title="Finish signing up"
              loading={isResuming}
              onPress={async () => {
                const resumeError = await resume(unfinishedEmail);
                if (resumeError) setFormError(resumeError);
              }}
            />
          ) : (
            <Button title="Send code" loading={isSubmitting} onPress={onSubmit} />
          )}
          {noAccount && (
            <Button
              title="Create new account"
              variant="secondary"
              onPress={() => router.push('/sign-up/email')}
            />
          )}
        </>
      }>
      <FormError message={formError} />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        autoFocus={!typedEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={onSubmit}
        // Editing the email starts over, so a previous "unfinished" / "no account" result is cleared.
        onFocus={resetResult}
      />
    </AuthStep>
  );
}
