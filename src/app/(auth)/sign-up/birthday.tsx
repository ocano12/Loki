import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, useColorScheme } from 'react-native';

import { AuthStep } from '@/components/auth-step';
import { Button } from '@/components/form/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCloseAuth } from '@/hooks/use-close-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSignUp } from '@/lib/sign-up-context';
import { supabase } from '@/lib/supabase';

// App Store / COPPA minimum age for an account.
const MINIMUM_AGE = 13;

function yearsAgo(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

function ageOn(birthDate: Date, today = new Date()) {
  let age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

/** YYYY-MM-DD in the device's local calendar (a birthday has no time zone). */
function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function SignUpBirthdayScreen() {
  const router = useRouter();
  const theme = useTheme();
  const scheme = useColorScheme();
  const closeAuth = useCloseAuth();
  const { draft, updateDraft } = useSignUp();
  // Start the wheel 18 years back rather than at today (or where they left it).
  const [birthDate, setBirthDate] = useState(() =>
    draft.birthDate ? fromIsoDate(draft.birthDate) : yearsAgo(18)
  );
  const [isLeaving, setIsLeaving] = useState(false);

  const onSubmit = async () => {
    if (ageOn(birthDate) >= MINIMUM_AGE) {
      // Kept on the device; saved with everything else on the final step.
      updateDraft({ birthDate: toIsoDate(birthDate) });
      router.push('/sign-up/password');
      return;
    }
    // Too young: remove the bare, email-only account the code created and sign out.
    // Nothing else (name, birthday) was ever sent to the server.
    setIsLeaving(true);
    await supabase.rpc('delete_unfinished_account');
    await supabase.auth.signOut({ scope: 'local' });
    setIsLeaving(false);
    Alert.alert(
      "You can't sign up right now",
      `You need to be at least ${MINIMUM_AGE} years old to create a WeClude account. You can still browse places without one.`
    );
    closeAuth();
  };

  return (
    <AuthStep
      title="What's your birthday?"
      subtitle="Use your own birthday. This won't be shown on your profile."
      footer={<Button title="Next" loading={isLeaving} onPress={onSubmit} />}>
      <ThemedView type="backgroundElement" style={styles.pickerCard}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Birthday
        </ThemedText>
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          accentColor={theme.primary}
          themeVariant={scheme === 'dark' ? 'dark' : 'light'}
          onValueChange={(_event, date) => setBirthDate(date)}
          style={styles.picker}
        />
      </ThemedView>
    </AuthStep>
  );
}

const styles = StyleSheet.create({
  pickerCard: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: 12,
  },
  picker: {
    alignSelf: 'stretch',
    height: 216,
  },
});
