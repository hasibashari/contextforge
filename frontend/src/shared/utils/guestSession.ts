/**
 * Anonymous Guest Session Manager
 * Provides a unique browser-scoped UUID for hackathon demo isolation.
 */

const GUEST_ID_KEY = 'cf_guest_id';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 compliant UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get existing guest ID from localStorage or generate a new one.
 */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return generateUUID();

  try {
    const stored = window.localStorage.getItem(GUEST_ID_KEY);
    if (stored && UUID_REGEX.test(stored.trim())) {
      return stored.trim();
    }

    const newId = generateUUID();
    window.localStorage.setItem(GUEST_ID_KEY, newId);
    return newId;
  } catch {
    return generateUUID();
  }
}

/**
 * Reset demo guest session: replaces localStorage guest ID with a fresh UUID.
 */
export function resetGuestSession(): string {
  if (typeof window === 'undefined') return generateUUID();

  try {
    const newId = generateUUID();
    window.localStorage.setItem(GUEST_ID_KEY, newId);
    return newId;
  } catch {
    return generateUUID();
  }
}
