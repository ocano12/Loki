import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthStep } from '@/components/auth-step';
import { Button } from '@/components/form/button';
import { FormError } from '@/components/form/form-error';
import { FormTextField } from '@/components/form/form-text-field';
import { getAccountStatus } from '@/lib/account-status';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { emailField } from '@/lib/auth-schemas';
import { sendSignUpCode } from '@/lib/sign-up-context';

const emailSchema = z.object({
  email: emailField,
});

type EmailInput = z.input<typeof emailSchema>;
type EmailValues = z.output<typeof emailSchema>;

export default function SignUpEmailScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EmailInput, unknown, EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);

    // Finished accounts go to log in rather than being silently signed in by the code.
    // Unfinished ones continue below, so the code lets them resume sign-up.
    try {
      if ((await getAccountStatus(email)) === 'active') {
        router.push({ pathname: '/sign-up/account-exists', params: { email } });
        return;
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }

    // Creates the account if needed and emails a 6-digit code (Confirm signup / Magic Link template).
    const { error } = await sendSignUpCode(email);
    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }
    router.push({ pathname: '/sign-up/code', params: { email } });
  });

  return (
    <AuthStep
      title="What's your email?"
      subtitle="We'll send you a code to confirm it. No one will see this on your profile."
      footer={<Button title="Next" loading={isSubmitting} onPress={onSubmit} />}>
      <FormError message={formError} />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        autoFocus
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={onSubmit}
      />
    </AuthStep>
  );
}
