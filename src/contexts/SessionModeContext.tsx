import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

export type SessionMode = 'personal' | 'business';

const MODE_KEY = 'packops_session_mode';

interface SessionModeContextValue {
  mode: SessionMode;
  setMode: (mode: SessionMode) => void;
}

const SessionModeContext = createContext<SessionModeContextValue | null>(null);

function readMode(): SessionMode {
  return localStorage.getItem(MODE_KEY) === 'business' ? 'business' : 'personal';
}

export function clearSessionMode() {
  localStorage.removeItem(MODE_KEY);
  localStorage.removeItem('packops_active_business_id');
}

export function SessionModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SessionMode>(readMode);

  const setMode = useCallback((next: SessionMode) => {
    localStorage.setItem(MODE_KEY, next);
    setModeState(next);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <SessionModeContext.Provider value={value}>{children}</SessionModeContext.Provider>;
}

export function useSessionMode() {
  const ctx = useContext(SessionModeContext);
  if (!ctx) throw new Error('useSessionMode must be used within SessionModeProvider');
  return ctx;
}
