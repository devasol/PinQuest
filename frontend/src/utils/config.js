/**
 * Centralized configuration for the PinQuest frontend.
 * This handles environment-aware constants like API URLs.
 */

// Deployment specific backend URL
const PRODUCTION_API_URL = 'https://pinquest.onrender.com/api/v1';

/**
 * Dynamically determines the API base URL based on the current environment.
 * 
 * Logic:
 * 1. Check if VITE_API_BASE_URL is explicitly set in environment variables (preferred)
 * 2. If not, check if we're running on localhost (development)
 * 3. If running on a production domain, use the production Render URL as a fallback
 */
const getApiBaseUrl = () => {
  // 1. Explicit environment variable check (Vite)
  // Note: import.meta.env.VITE_API_BASE_URL is replaced at build time
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envUrl && !envUrl.includes('localhost') && envUrl !== '') {
    return envUrl;
  }

  // 2. Runtime domain-based detection
  if (typeof window !== 'undefined' && window.location) {
    const { hostname } = window.location;
    
    // If we're not on localhost/127.0.0.1, we're likely in a production build
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
    
    if (!isLocal) {
      return PRODUCTION_API_URL;
    }
  }

  // 3. Final fallback for local development if everything else fails
  return envUrl || 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

// Timeout configuration (in milliseconds)
// Increased to 50 seconds to account for free-tier backend cold starts (Render/Vercel)
export const API_TIMEOUT = 50000;

export default {
  API_BASE_URL,
  API_TIMEOUT,
};
