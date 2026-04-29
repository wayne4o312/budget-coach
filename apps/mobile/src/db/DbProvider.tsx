import React from 'react';

import type { Db } from './db';
import { getDb } from './db';

type DbContextValue = {
  db: Db | null;
  ready: boolean;
  error: Error | null;
};

const DbContext = React.createContext<DbContextValue>({
  db: null,
  ready: false,
  error: null,
});

export function useDb() {
  return React.useContext(DbContext);
}

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DbContextValue>({
    db: null,
    ready: false,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        if (cancelled) return;
        setState({ db, ready: true, error: null });
      } catch (e) {
        if (cancelled) return;
        setState({ db: null, ready: false, error: e instanceof Error ? e : new Error('DB init failed') });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <DbContext.Provider value={state}>{children}</DbContext.Provider>;
}

