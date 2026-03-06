/**
 * Centralized environment configuration.
 *
 * - LOCAL DEV:  Vite injects VITE_* from .env.local at build time
 *               → import.meta.env.VITE_* is available directly
 *
 * - DOCKER:     The entrypoint script generates /env-config.js at container
 *               startup which sets window.__ENV__ with expanded URLs.
 *               → window.__ENV__.VITE_* takes priority
 *
 * Usage in any service:
 *   import { env } from '../env';
 *   const url = env('VITE_API_URL_LDAP');
 */

export function env(key) {
  // Runtime injection (Docker) has priority
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key] !== undefined) {
    return window.__ENV__[key];
  }
  // Build-time injection (Vite local dev)
  return import.meta.env[key];
}

export default env;
