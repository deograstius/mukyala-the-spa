import { createContext, useContext } from 'react';

/**
 * Shell-provided session callback. Pages call `onAuthExpired` when the API
 * answers 401 for an expired/invalid token; the shell drops the stored token
 * and falls back to the login screen.
 */
export const AdminAuthContext = createContext<{ onAuthExpired: () => void }>({
  onAuthExpired: () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
