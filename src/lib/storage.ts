/**
 * Temporary browser state. Everything lives in sessionStorage and disappears
 * when the tab is closed. No personal data is stored.
 */

export const storageKeys = {
  servings: (id: string) => `bn:servings:${id}`,
  shopping: (id: string) => `bn:shopping:${id}`
};

/** Prefix shared by every shopping list key. */
export const SHOPPING_PREFIX = 'bn:shopping:';

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

/** Removes every key with the given prefix, e.g. all shopping lists when returning to the index. */
export function clearSessionPrefix(prefix: string): void {
  const store = getSession();
  if (!store) return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith(prefix)) doomed.push(key);
    }
    for (const key of doomed) store.removeItem(key);
  } catch {
    /* ignore */
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
