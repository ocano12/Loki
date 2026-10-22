import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

/** Turns a Supabase auth error into a short, friendly message for the user. */
export function getAuthErrorMessage(error: unknown): string {
  if (isAuthRetryableFetchError(error)) {
    return "Can't reach WeClude right now. Check your connection and try again.";
  }
  if (isAuthError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Incorrect email or password.';
      case 'email_not_confirmed':
        return 'Please confirm your email before logging in.';
      case 'over_email_send_rate_limit': {
        // Per-address cooldown: "For security purposes, you can only request this after 42 seconds."
        const seconds = error.message.match(/after (\d+) seconds?/)?.[1];
        if (seconds) {
          return `We just sent you a code. You can request another in ${seconds} seconds.`;
        }
        // Otherwise it's the project-wide hourly email limit.
        return "We've sent too many emails recently. Please try again in a little while.";
      }
      case 'over_request_rate_limit':
        return 'Too many attempts. Please wait a few minutes and try again.';
      case 'user_banned':
        return 'This account has been suspended.';
      case 'otp_expired':
        return "That code isn't right or has expired. Check the latest email, or send a new code.";
      case 'weak_password':
        return 'Choose a stronger password — try a longer phrase, or add numbers or symbols.';
      case 'same_password':
        return 'Choose a different password from your current one.';
    }
  }
  return 'Something went wrong. Please try again.';
}
