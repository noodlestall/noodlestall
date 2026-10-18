/**
 * Temporary browser state. Everything lives in sessionStorage and disappears
 * when the tab is closed. No personal data is stored.
 */

export const storageKeys = {
  servings: (id: string) => `bn:servings:${id}`,
  shopping: (id: string) => `bn:shopping:${id}`,
  steps: (id: string) => `bn:steps:${id}`
};

export const THEME_KEY = 'bn:theme';

function getSession(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readSession<T>(key: string, fallback: T): T {
  const store = getSession();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeSession(key: string, value: unknown): void {
  const store = getSession();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be full or blocked; the page keeps working without it */
  }
}

export function removeSession(key: string): void {
  const store = getSession();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}
