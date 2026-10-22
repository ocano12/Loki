import { useLocalSearchParams, useRouter } from 'expo-router';

import { CodeStep } from '@/components/code-step';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const onVerify = async (token: string) => {
    // A valid recovery code signs the user in so they can choose a new password.
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
    if (error) return { error };
    router.replace('/forgot-password/new-password');
  };

  return (
    <CodeStep
      title="Enter the reset code"
      email={email}
      onVerify={onVerify}
      onResend={() => supabase.auth.resetPasswordForEmail(email)}
    />
  );
}
