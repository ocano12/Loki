import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { z } from 'zod';

import { AuthStep } from '@/components/auth-step';
import { Button } from '@/components/form/button';
import { FormError } from '@/components/form/form-error';
import { FormTextField } from '@/components/form/form-text-field';
import { useCloseAuth } from '@/hooks/use-close-auth';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { MIN_PASSWORD_LENGTH, newPasswordField, PASSWORD_RULES } from '@/lib/auth-schemas';
import { supabase } from '@/lib/supabase';

const newPasswordSchema = z.object({ password: newPasswordField });

type NewPasswordValues = z.infer<typeof newPasswordSchema>;

export default function NewPasswordScreen() {
  const closeAuth = useCloseAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }
    Alert.alert('Password updated', "You're logged in with your new password.");
    closeAuth();
  });

  return (
    <AuthStep
      // The code already signed them in; going back to it would be confusing.
      canGoBack={false}
      title="Choose a new password"
      subtitle={`Use at least ${MIN_PASSWORD_LENGTH} characters — something others can't guess.`}
      footer={<Button title="Save password" loading={isSubmitting} onPress={onSubmit} />}>
      <FormError message={formError} />
      <FormTextField
        control={control}
        name="password"
        label="New password"
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
