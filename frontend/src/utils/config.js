/**
 * Centralized configuration for the PinQuest frontend.
 * Handles environment-aware API URLs for local dev, Vercel, and Render.
 */

// Fallback when no env is set (legacy Render deployment)
const RENDER_API_URL = 'https://pinquest.onrender.com/api/v1';

const normalizeApiUrl = (url) => url.replace(/\/+$/, '');

/**
 * Returns true when envUrl points at the same host as the page but is not an API path
 * (common misconfiguration: VITE_API_BASE_URL set to the frontend Vercel URL).
 */
const isFrontendMisconfiguration = (envUrl) => {
  if (typeof window === 'undefined' || !envUrl) return false;

  try {
    const resolved = new URL(envUrl, window.location.origin);
    const sameHost = resolved.hostname === window.location.hostname;
    const hasApiPath = resolved.pathname.startsWith('/api');
    return sameHost && !hasApiPath;
  } catch {
    return false;
  }
};

/**
 * Dynamically determines the API base URL based on the current environment.
 *
 * Priority:
 * 1. VITE_API_BASE_URL (build-time) — must be the BACKEND URL, e.g. https://your-api.vercel.app/api/v1
 * 2. Relative /api/v1 on production hosts (when using Vercel rewrites to proxy the API)
 * 3. Render fallback for production
 * 4. localhost for development
 */
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (envUrl) {
    if (envUrl.startsWith('/')) {
      if (typeof window !== 'undefined') {
        return normalizeApiUrl(`${window.location.origin}${envUrl}`);
      }
      return normalizeApiUrl(envUrl);
    }

    if (!envUrl.includes('localhost')) {
      if (!isFrontendMisconfiguration(envUrl)) {
        return normalizeApiUrl(envUrl);
      }
      console.warn(
        '[PinQuest] VITE_API_BASE_URL points at the frontend host. ' +
          'Set it to your backend deployment URL (e.g. https://pin-quest-api.vercel.app/api/v1).'
      );
    } else if (envUrl.includes('localhost')) {
      return normalizeApiUrl(envUrl);
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    const { hostname } = window.location;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.');

    if (!isLocal) {
      // Production without a valid env: use Render backend (works out of the box)
      return RENDER_API_URL;
    }
  }

  return normalizeApiUrl(envUrl || 'http://localhost:5000/api/v1');
};

export const API_BASE_URL = getApiBaseUrl();

console.log('PinQuest API:', API_BASE_URL);

// Timeout for free-tier / serverless cold starts
export const API_TIMEOUT = 50000;

export default {
  API_BASE_URL,
  API_TIMEOUT,
};
