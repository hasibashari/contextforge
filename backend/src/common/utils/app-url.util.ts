/**
 * Utility to determine application URLs dynamically across environments:
 * - Google Cloud Run or Custom Domain (PUBLIC_APP_URL, APP_URL, FRONTEND_URL)
 * - Localhost development fallbacks
 */

export function getAppBaseUrl(): string {
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://contextforge-441184699407.us-central1.run.app';
  }
  return 'http://localhost:5173';
}

export function getApiBaseUrl(): string {
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://contextforge-441184699407.us-central1.run.app';
  }
  const port = process.env.PORT || '8080';
  return `http://localhost:${port}`;
}
