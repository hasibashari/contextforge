import { getOrCreateGuestId } from '../utils/guestSession';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Returns standard API headers including the browser-scoped X-Guest-Id
 */
export function getApiHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const guestId = getOrCreateGuestId();
  return {
    'Content-Type': 'application/json',
    'X-Guest-Id': guestId,
    ...(customHeaders || {}),
  };
}

export async function handleApiResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errJson = (await res.json()) as { message?: string };
      if (errJson.message) errorMsg = errJson.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMsg);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}
