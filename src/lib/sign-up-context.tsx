import type { User } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';

/**
 * Sign-up details held on the device until the final "Sign up" tap, so nothing personal is
 * written to Supabase until the account is finished. (Verifying the email code does create a
 * bare, email-only account — Supabase ties codes to accounts — flagged with `signup_pending`.)
 */
type SignUpDraft = {
  fullName?: string;
  /** YYYY-MM-DD */
  birthDate?: string;
};

type SignUpContextValue = {
  draft: SignUpDraft;
  updateDraft: (changes: SignUpDraft) => void;
  /** Call once the account is finished so closing the sheet doesn't sign the user out. */
  markComplete: () => void;
};

const SignUpContext = createContext<SignUpContextValue | null>(null);

/** Metadata flag on accounts whose sign-up isn't finished; cleared on the final Sign up tap. */
export const SIGNUP_PENDING_KEY = 'signup_pending';

/** True for an account that verified its email but hasn't finished signing up. */
export function isSignUpPending(user: User | null | undefined) {
  const metadata = user?.user_metadata;
  // `onboarding_complete: false` is the same flag from the app's earlier sign-up flow.
  return metadata?.[SIGNUP_PENDING_KEY] === true || metadata?.onboarding_complete === false;
}

/**
 * Emails a sign-up code. New accounts are created already flagged as pending, so the moment the
 * code is verified the app knows it's an unfinished sign-up (and keeps showing the guest UI).
 */
export function sendSignUpCode(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: { [SIGNUP_PENDING_KEY]: true } },
  });
}

/** Signs out a bare, unfinished account so it never looks like a logged-in user. */
export async function signOutIfSignUpPending() {
  const { data } = await supabase.auth.getSession();
  if (isSignUpPending(data.session?.user)) {
    await supabase.auth.signOut({ scope: 'local' });
  }
}

export function SignUpProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<SignUpDraft>({});
  const isComplete = useRef(false);

  const updateDraft = useCallback((changes: SignUpDraft) => {
    setDraft((current) => ({ ...current, ...changes }));
  }, []);

  const markComplete = useCallback(() => {
    isComplete.current = true;
  }, []);

  // The provider lives as long as the auth sheet. If the sheet closes mid-sign-up (swipe down,
  // close button), drop the half-made session; they can resume later via "Finish signing up".
  useEffect(() => {
    return () => {
      if (!isComplete.current) signOutIfSignUpPending();
    };
  }, []);

  return <SignUpContext value={{ draft, updateDraft, markComplete }}>{children}</SignUpContext>;
}

export function useSignUp() {
  const value = use(SignUpContext);
  if (!value) {
    throw new Error('useSignUp must be used within a SignUpProvider');
  }
  return value;
}
