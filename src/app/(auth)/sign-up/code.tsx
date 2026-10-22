import { useLocalSearchParams, useRouter } from 'expo-router';

import { CodeStep } from '@/components/code-step';
import { isSignUpPending, sendSignUpCode, SIGNUP_PENDING_KEY } from '@/lib/sign-up-context';
import { supabase } from '@/lib/supabase';

export default function SignUpCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const onVerify = async (token: string) => {
    // Verifies the email. Supabase ties codes to accounts, so this confirms a bare, email-only
    // account and signs in to it; name, birthday and password are only saved on the last step.
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) return { error };

    // Accounts are created already flagged as pending (see sendSignUpCode). Older ones may not be,
    // so add the flag if it's missing — it keeps an abandoned sign-up from looking logged in.
    if (!isSignUpPending(data.user)) {
      const { error: flagError } = await supabase.auth.updateUser({ data: { [SIGNUP_PENDING_KEY]: true } });
      if (flagError) return { error: flagError };
    }

    // There's no going back to the code once it's verified.
    router.replace('/sign-up/name');
  };

  return (
    <CodeStep
      title="Enter the confirmation code"
      email={email}
      onVerify={onVerify}
      onResend={() => sendSignUpCode(email)}
    />
  );
}
