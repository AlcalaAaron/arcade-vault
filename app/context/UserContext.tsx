'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserContextValue {
  user: User | null;
  session: Session | null;
  username: string | null;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  session: null,
  username: null,
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const user = session?.user ?? null;
  const metadataUsername = user?.user_metadata?.username;
  const username =
    typeof metadataUsername === 'string' ? metadataUsername : null;

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <UserContext.Provider value={{ user, session, username, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
