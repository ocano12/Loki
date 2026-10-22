import { supabase } from '@/lib/supabase';

/**
 * - `none`: no account with this email
 * - `unverified`: a sign-up code was sent but never entered
 * - `incomplete`: email verified, but sign-up was never finished (no password yet)
 * - `active`: finished account that can log in with a password
 */
export type AccountStatus = 'none' | 'unverified' | 'incomplete' | 'active';

/** Looks up what kind of account an email has (see the account_verification migration). */
export async function getAccountStatus(email: string): Promise<AccountStatus> {
  const { data, error } = await supabase.rpc('email_account_status', { p_email: email });
  if (error) throw error;
  return data as AccountStatus;
}

/** True when the person started signing up but never finished — they should resume, not log in. */
export function isUnfinished(status: AccountStatus) {
  return status === 'unverified' || status === 'incomplete';
}
