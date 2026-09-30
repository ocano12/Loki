// https://docs.expo.dev/guides/using-supabase/
// Provides a SQLite-backed `localStorage` on iOS/Android (no-op on web, which has its own).
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill them in.'
  );
}

// During web static rendering there is no window/localStorage, so fall back to
// supabase-js's in-memory storage there.
const storage = typeof window !== 'undefined' ? globalThis.localStorage : undefined;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    // iOS/Android have no URL to read a session from; deep links are handled manually.
    detectSessionInUrl: false,
  },
});

// Only refresh tokens while the app is in the foreground.
// https://supabase.com/docs/reference/javascript/auth-startautorefresh
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
