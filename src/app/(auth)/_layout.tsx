import { Stack } from 'expo-router/stack';

import { SignUpProvider } from '@/lib/sign-up-context';

/** Log in, sign-up and password-reset screens. Presented as a modal over the tabs (see root layout). */
export default function AuthLayout() {
  return (
    <SignUpProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SignUpProvider>
  );
}
