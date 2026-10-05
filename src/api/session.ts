import type { AuthTokens, User } from '../types';

export const SESSION_KEY = 'shop.session.v1';
export const SESSION_EVENT = 'shop:session';
export interface Session {
  id: string;
  access: string;
  refresh?: string;
  user?: User;
}

function publish(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const value = JSON.parse(raw) as Session;
      if (typeof value.id === 'string' && typeof value.access === 'string') return value;
    } catch { /* Recover from an incomplete browser storage record. */ }
    localStorage.removeItem(SESSION_KEY);
  }
  const access = localStorage.getItem('access');
  const refresh = localStorage.getItem('refresh');
  if (!access && !refresh) return null;
  const session: Session = { id: crypto.randomUUID(), access: access || '', refresh: refresh || undefined };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  return session;
}

export function startSession(tokens: AuthTokens): Session {
  const session = { id: crypto.randomUUID(), ...tokens };
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  publish(session);
  return session;
}

export function clearSession(expectedId?: string) {
  if (expectedId && getSession()?.id !== expectedId) return;
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  publish(null);
}

export function updateSessionTokens(id: string, tokens: { access: string; refresh?: string }): boolean {
  const session = getSession();
  if (session?.id !== id) return false;
  publish({ ...session, access: tokens.access, refresh: tokens.refresh || session.refresh });
  return true;
}

export function updateSessionUser(id: string, user: User) {
  const session = getSession();
  if (session?.id === id) publish({ ...session, user });
}
