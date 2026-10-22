import { z } from 'zod';

export const MIN_PASSWORD_LENGTH = 8;

/** Trimmed, lower-cased email — matches how Supabase stores addresses. */
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address.' }));

/** Rules for choosing a password (sign-up and reset). Logging in only checks it isn't empty. */
export const newPasswordField = z.string().min(MIN_PASSWORD_LENGTH, {
  error: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
});

/** iOS strong-password suggestions follow these rules. */
export const PASSWORD_RULES = `minlength: ${MIN_PASSWORD_LENGTH}; required: lower; required: digit;`;
