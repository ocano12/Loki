import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthStep } from '@/components/auth-step';
import { Button } from '@/components/form/button';
import { FormTextField } from '@/components/form/form-text-field';
import { useSignUp } from '@/lib/sign-up-context';

// Matches the profiles.display_name check constraint (1–50 characters).
const nameSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { error: 'Enter your name.' })
    .max(50, { error: 'Keep it to 50 characters or fewer.' }),
});

type NameInput = z.input<typeof nameSchema>;
type NameValues = z.output<typeof nameSchema>;

export default function SignUpNameScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useSignUp();

  const { control, handleSubmit } = useForm<NameInput, unknown, NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { fullName: draft.fullName ?? '' },
  });

  // Kept on the device; saved with everything else on the final step.
  const onSubmit = handleSubmit(({ fullName }) => {
    updateDraft({ fullName });
    router.push('/sign-up/birthday');
  });

  return (
    <AuthStep
      // The code is already verified, so there's nothing to go back to.
      canGoBack={false}
      title="What's your name?"
      subtitle="This is how you'll appear on reviews and notes."
      footer={<Button title="Next" onPress={onSubmit} />}>
      <FormTextField
        control={control}
        name="fullName"
        label="Full name"
        autoFocus
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={onSubmit}
      />
    </AuthStep>
  );
}
