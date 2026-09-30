import { ActivityIndicator } from 'react-native';

import { GuestPrompt } from '@/components/guest-prompt';
import { TabScreen } from '@/components/tab-screen';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/lib/session-provider';

export default function SavedScreen() {
  const { session, isLoading } = useSession();
  const theme = useTheme();

  return (
    <TabScreen title="Saved">
      {isLoading ? (
        <ActivityIndicator color={theme.textSecondary} accessibilityLabel="Loading" />
      ) : session ? (
        // The saved list (and its saved_businesses table) comes with business search.
        <GuestPrompt
          icon={{ ios: 'heart', android: 'favorite' }}
          title="No saved places yet"
          message="Places you save will show up here."
        />
      ) : (
        <GuestPrompt
          icon={{ ios: 'heart', android: 'favorite' }}
          title="Log in to see your saved places"
          message="Save places that work for you so you can find them again."
        />
      )}
    </TabScreen>
  );
}
