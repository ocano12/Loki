import { useRouter } from 'expo-router';
import { useState } from 'react';

import { getAuthErrorMessage } from '@/lib/auth-errors';
import { sendSignUpCode } from '@/lib/sign-up-context';

/**
 * For people who started signing up but never finished: sends a fresh code and continues
 * the sign-up flow from the code screen.
 */
export function useResumeSignUp() {
  const router = useRouter();
  const [isResuming, setIsResuming] = useState(false);

  const resume = async (email: string): Promise<string | null> => {
    setIsResuming(true);
    const { error } = await sendSignUpCode(email);
    setIsResuming(false);
    if (error) return getAuthErrorMessage(error);
    router.push({ pathname: '/sign-up/code', params: { email } });
    return null;
  };

  return { resume, isResuming };
}
