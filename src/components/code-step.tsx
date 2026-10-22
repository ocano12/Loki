import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthStep } from '@/components/auth-step';
import { Button } from '@/components/form/button';
import { FormError } from '@/components/form/form-error';
import { TextField } from '@/components/form/text-field';
import { ThemedText } from '@/components/themed-text';
import { getAuthErrorMessage } from '@/lib/auth-errors';

const CODE_LENGTH = 6;
// Supabase won't send another code to the same address within 60 seconds.
const RESEND_COOLDOWN_SECONDS = 60;

type CodeStepProps = {
  title: string;
  email: string;
  /** Checks the code with Supabase. Return an error to show it; navigate on success. */
  onVerify: (code: string) => Promise<{ error: unknown } | void>;
  /** Sends a fresh code. */
  onResend: () => Promise<{ error: unknown }>;
};

/** 6-digit email code entry, shared by sign-up and password reset. Auto-submits on the 6th digit. */
export function CodeStep({ title, email, onVerify, onResend }: CodeStepProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verify = async (token: string) => {
    if (token.length !== CODE_LENGTH || isVerifying) return;
    setIsVerifying(true);
    setFormError(null);
    const result = await onVerify(token);
    setIsVerifying(false);
    if (result?.error) setFormError(getAuthErrorMessage(result.error));
  };

  const onChangeCode = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) verify(digits);
  };

  const resend = async () => {
    setFormError(null);
    setNotice(null);
    const { error } = await onResend();
    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }
    setNotice('We sent a new code.');
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <AuthStep
      title={title}
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
      footer={
        <>
          <Button title="Next" loading={isVerifying} onPress={() => verify(code)} />
          <Button
            title={cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            variant="text"
            disabled={cooldown > 0}
            onPress={resend}
          />
        </>
      }>
      <FormError message={formError} />
      <TextField
        label="Code"
        value={code}
        onChangeText={onChangeCode}
        autoFocus
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        style={styles.code}
      />
      <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
        {notice ? `${notice} ` : ''}Can&apos;t find it? Check your spam folder.
      </ThemedText>
    </AuthStep>
  );
}

const styles = StyleSheet.create({
  code: {
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
  },
});
