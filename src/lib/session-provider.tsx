import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { isSignUpPending } from '@/lib/sign-up-context';
import { supabase } from '@/lib/supabase';

type SessionContextValue = {
  /** The signed-in user's session, or null for guests (including people mid-sign-up). */
  session: Session | null;
  /** True until the stored session (if any) has been restored on launch. */
  isLoading: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fires immediately with INITIAL_SESSION (restored from storage), then on every
    // sign-in, sign-out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Mid-sign-up the device holds a session for the bare account (needed to save the final
      // details), but the person isn't logged in yet: keep showing the guest UI until they finish.
      if (isSignUpPending(nextSession?.user)) {
        // On launch it can only be a sign-up that was abandoned (app killed), so clear it.
        // Deferred: Supabase calls made inside this callback can deadlock.
        if (event === 'INITIAL_SESSION') setTimeout(() => supabase.auth.signOut({ scope: 'local' }), 0);
        setSession(null);
        setIsLoading(false);
        return;
      }
      setSession(nextSession);
      setIsLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <SessionContext value={{ session, isLoading }}>{children}</SessionContext>;
}

export function useSession() {
  const value = use(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return value;
}
