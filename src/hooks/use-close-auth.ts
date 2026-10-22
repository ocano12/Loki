import { useNavigation } from 'expo-router';
import { useCallback } from 'react';

/**
 * Closes the whole (auth) modal from any screen inside it — e.g. after the last sign-up step —
 * returning to wherever the user opened it from.
 */
export function useCloseAuth() {
  const navigation = useNavigation();

  return useCallback(() => {
    // This screen's navigator is the (auth) stack; its parent is the root stack holding the modal.
    const root = navigation.getParent();
    if (root?.canGoBack()) {
      root.goBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);
}
