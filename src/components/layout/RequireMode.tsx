import { Navigate, Outlet } from 'react-router-dom';
import { useSessionMode, type SessionMode } from '@/contexts/SessionModeContext';

/**
 * Gate a route subtree to a session mode. A mismatched mode is redirected to the
 * other mode's home, keeping the personal (dog) app and the business CRM cleanly
 * separated. Mode is a UX router only — never a security boundary (Firestore
 * rules are authoritative).
 */
export default function RequireMode({ mode }: { mode: SessionMode }) {
  const { mode: current } = useSessionMode();
  if (current !== mode) {
    return <Navigate to={mode === 'business' ? '/' : '/business'} replace />;
  }
  return <Outlet />;
}
