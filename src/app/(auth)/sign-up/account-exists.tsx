import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AuthStep } from '@/components/auth-step';
import { Button } from '@/components/form/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Shown when someone tries to sign up with an email that already has an account. */
export default function AccountExistsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  return (
    <AuthStep
      title="You already have an account"
      subtitle={`${email} is already linked to a WeClude account. Log in to continue.`}
      footer={
        <>
          <Button
            title="Log in"
            // Back to the login screen (already in this stack), with the email filled in.
            onPress={() => router.dismissTo({ pathname: '/login', params: { email } })}
          />
          <Button
            title="Reset password"
            variant="secondary"
            onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
          />
          <Button title="Use a different email" variant="text" onPress={() => router.back()} />
        </>
      }>
      <View style={styles.icon}>
        <SymbolView
          name={{ ios: 'person.crop.circle.badge.checkmark', android: 'how_to_reg' }}
          size={72}
          tintColor={theme.primary}
        />
      </View>
    </AuthStep>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
});
